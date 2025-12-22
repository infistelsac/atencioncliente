
import React, { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { NetworkDevice, DeviceType, ConnectionStatus } from '../../types/monitoring';
import { analyzeNetworkIssue } from '../../services/geminiService';

interface TopologyMapProps {
  devices: NetworkDevice[];
  onSelectDevice: (device: NetworkDevice) => void;
  expandedSites: Set<string>;
  onToggleSite: (siteId: string) => void;
}

// Icon paths assume a 256x256 viewbox
const ICONS = {
  [DeviceType.CORE_ROUTER]: `<path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm64-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h48A8,8,0,0,1,192,128Z"/>`,
  [DeviceType.SWITCH]: `<path d="M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32Zm-16,40V184a8,8,0,0,1-8,8H72a8,8,0,0,1-8-8V72a8,8,0,0,1,8-8H184A8,8,0,0,1,192,72Z"/>`,
  [DeviceType.OLT]: `<path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,160H40V56H216V200ZM184,96a12,12,0,1,1-12-12A12,12,0,0,1,184,96Zm0,64a12,12,0,1,1-12-12A12,12,0,0,1,184,160ZM84,96a12,12,0,1,1-12-12A12,12,0,0,1,84,96Zm0,64a12,12,0,1,1-12-12A12,12,0,0,1,84,160Z"/>`,
  [DeviceType.TPLINK]: `<path d="M152,112a24,24,0,1,1-24-24A24,24,0,0,1,152,112Zm75,3.1a8,8,0,0,0-10.1,5A80.11,80.11,0,0,1,60.1,183.1a8,8,0,0,0-5,10.1,8,8,0,0,0,10.1,5,96.14,96.14,0,0,0,186.8-63.2A8,8,0,0,0,227,115.1Zm-40.7,11a8,8,0,0,0-10.1,5,40.12,40.12,0,0,1-96.4,31.7,8,8,0,0,0-5,10.1,8,8,0,0,0,10.1,5,56.1,56.1,0,0,0,106.5-36.7A8,8,0,0,0,186.3,126.1Z"/>`,
  [DeviceType.ODF]: `<path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm-24,80a8,8,0,0,1-8,8H144v32a8,8,0,0,1-16,0V128H88a8,8,0,0,1,0-16h40V80a8,8,0,0,1,16,0v32h40A8,8,0,0,1,192,120Z"/>`,
  [DeviceType.GATEWAY]: `<path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM40,56H216V144H40ZM216,200H40V160H216v40Z"/>`
};

const TopologyMap: React.FC<TopologyMapProps> = ({ devices, onSelectDevice, expandedSites, onToggleSite }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [isPinging, setIsPinging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  const activeSelectedDevice = useMemo(() => 
    selectedDeviceId ? devices.find(d => d.id === selectedDeviceId) || null : null
  , [devices, selectedDeviceId]);

  const visibleNodes = useMemo(() => {
    return devices.filter(d => {
      if (d.type === DeviceType.CORE_ROUTER) return true;
      return expandedSites.has(d.siteId);
    });
  }, [devices, expandedSites]);

  const visibleLinks = useMemo(() => {
    const links: { source: string; target: string; value: number; isOffline: boolean; isCancelled: boolean }[] = [];
    const seen = new Set<string>();
    const visibleIds = new Set(visibleNodes.map(n => n.id));

    devices.forEach(d => {
      if (!visibleIds.has(d.id)) return;
      d.links.forEach(targetId => {
        if (!visibleIds.has(targetId)) return;
        const pair = [d.id, targetId].sort().join('-');
        if (!seen.has(pair)) {
          const sD = devices.find(x => x.id === d.id);
          const tD = devices.find(x => x.id === targetId);
          const isCore = sD?.type === DeviceType.CORE_ROUTER && tD?.type === DeviceType.CORE_ROUTER;
          const isOffline = sD?.status === ConnectionStatus.OFFLINE || tD?.status === ConnectionStatus.OFFLINE || sD?.status === ConnectionStatus.FAULT || tD?.status === ConnectionStatus.FAULT;
          const isCancelled = sD?.status === ConnectionStatus.CANCELLED || tD?.status === ConnectionStatus.CANCELLED;
          links.push({ source: d.id, target: targetId, value: isCore ? 4 : 1, isOffline, isCancelled });
          seen.add(pair);
        }
      });
    });
    return links;
  }, [devices, visibleNodes]);

  const handlePing = () => {
    if (!activeSelectedDevice) return;
    setIsPinging(true);
    setTimeout(() => setIsPinging(false), 2000);
  };

  const handleAIAnalyze = async () => {
    if (!activeSelectedDevice) return;
    setIsAnalyzing(true);
    setAiAnalysis(null);
    const result = await analyzeNetworkIssue(activeSelectedDevice, devices);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || visibleNodes.length === 0) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const centerX = width / 2;
    const centerY = height / 2;
    const peripheryRadius = Math.min(width, height) / 2 - 80;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const defs = svg.append("defs");
    
    const createGlow = (id: string, color: string, deviation: string) => {
      const filter = defs.append("filter").attr("id", id).attr("x", "-50%").attr("y", "-50%").attr("width", "200%").attr("height", "200%");
      filter.append("feGaussianBlur").attr("stdDeviation", deviation).attr("result", "blur");
      const feFlood = filter.append("feFlood").attr("flood-color", color).attr("flood-opacity", "0.5").attr("result", "flood");
      filter.append("feComposite").attr("in", "flood").attr("in2", "blur").attr("operator", "in").attr("result", "glow");
      const feMerge = filter.append("feMerge");
      feMerge.append("feMergeNode").attr("in", "glow");
      feMerge.append("feMergeNode").attr("in", "SourceGraphic");
    };

    createGlow("glow-online", "#6366f1", "4");
    createGlow("glow-warning", "#f59e0b", "5");
    createGlow("glow-offline", "#ef4444", "7");
    createGlow("glow-admin", "#a855f7", "5");

    const g = svg.append("g").attr("class", "zoom-container");
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoom);

    const simulation = d3.forceSimulation<any>(visibleNodes)
      .force("link", d3.forceLink(visibleLinks).id((d: any) => d.id).distance(d => d.isOffline ? 400 : (d.value === 4 ? 200 : 100)).strength(d => d.isOffline ? 0.05 : 0.8))
      .force("charge", d3.forceManyBody().strength(d => d.status === ConnectionStatus.OFFLINE ? -500 : (d.type === DeviceType.CORE_ROUTER ? -2000 : -600)))
      .force("center", d3.forceCenter(centerX, centerY).strength(0.05))
      .force("radial", d3.forceRadial(d => d.status === ConnectionStatus.OFFLINE ? peripheryRadius : 0, centerX, centerY).strength(d => d.status === ConnectionStatus.OFFLINE ? 1.0 : 0.2))
      .force("collision", d3.forceCollide().radius(d => d.type === DeviceType.CORE_ROUTER ? 60 : 40));

    const link = g.append("g")
      .selectAll("line")
      .data(visibleLinks)
      .join("line")
      .attr("stroke", d => d.isCancelled ? "#1e293b" : (d.isOffline ? "#334155" : (d.value === 4 ? "#6366f1" : "#475569")))
      .attr("stroke-opacity", d => d.isCancelled ? 0.1 : (d.isOffline ? 0.2 : 0.6))
      .attr("stroke-width", d => d.value === 4 ? 3 : 1.5)
      .attr("stroke-dasharray", d => d.value === 4 ? "none" : "6,3");

    const flowCircles = g.append("g")
      .selectAll("circle")
      .data(visibleLinks.filter(l => l.value === 4 && !l.isOffline && !l.isCancelled))
      .join("circle")
      .attr("r", 3)
      .attr("fill", "#818cf8")
      .attr("filter", "url(#glow-online)");

    function animateTraffic() {
      flowCircles
        .transition()
        .duration(2000)
        .ease(d3.easeLinear)
        .attrTween("cx", d => {
          const s = (d.source as any), t = (d.target as any);
          return (p: number) => s.x + (t.x - s.x) * p;
        })
        .attrTween("cy", d => {
          const s = (d.source as any), t = (d.target as any);
          return (p: number) => s.y + (t.y - s.y) * p;
        })
        .on("end", animateTraffic);
    }
    animateTraffic();

    const node = g.append("g")
      .selectAll("g")
      .data(visibleNodes)
      .join("g")
      .attr("class", "node-group")
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        if (d.type === DeviceType.CORE_ROUTER) onToggleSite(d.siteId);
        onSelectDevice(d);
        setSelectedDeviceId(d.id);
        setAiAnalysis(null);
        event.stopPropagation();
      })
      .call(d3.drag<any, any>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x; d.fy = d.y;
        })
        .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          if (d.status === ConnectionStatus.OFFLINE) { d.fx = d.x; d.fy = d.y; } else { d.fx = null; d.fy = null; }
        }));

    node.append("circle")
      .attr("r", d => d.type === DeviceType.CORE_ROUTER ? 32 : 24)
      .attr("fill", d => {
        if (d.status === ConnectionStatus.CANCELLED) return "#0f172a";
        if (d.status === ConnectionStatus.OFFLINE || d.status === ConnectionStatus.FAULT) return "#450a0a";
        if (d.status === ConnectionStatus.WARNING) return "#451a03";
        if (d.status === ConnectionStatus.SUSPENDED || d.status === ConnectionStatus.NON_PAYMENT) return "#1e1b4b";
        return "#020617";
      })
      .attr("stroke", d => {
        if (d.status === ConnectionStatus.CANCELLED) return "#1e293b";
        if (d.status === ConnectionStatus.OFFLINE || d.status === ConnectionStatus.FAULT) return "#ef4444";
        if (d.status === ConnectionStatus.WARNING) return "#f59e0b";
        if (d.status === ConnectionStatus.SUSPENDED) return "#a855f7";
        if (d.status === ConnectionStatus.NON_PAYMENT) return "#f97316";
        return d.type === DeviceType.CORE_ROUTER ? "#6366f1" : "#475569";
      })
      .attr("stroke-width", 2)
      .attr("opacity", d => d.status === ConnectionStatus.CANCELLED ? 0.4 : 1)
      .attr("filter", d => {
        if (d.status === ConnectionStatus.CANCELLED) return "none";
        if (d.status === ConnectionStatus.OFFLINE || d.status === ConnectionStatus.FAULT) return "url(#glow-offline)";
        if (d.status === ConnectionStatus.WARNING) return "url(#glow-warning)";
        if (d.status === ConnectionStatus.SUSPENDED || d.status === ConnectionStatus.NON_PAYMENT) return "url(#glow-admin)";
        return d.type === DeviceType.CORE_ROUTER ? "url(#glow-online)" : "none";
      })
      .attr("class", d => (d.status === ConnectionStatus.OFFLINE || d.status === ConnectionStatus.FAULT) ? "animate-pulse" : "animate-[pulse_10s_ease-in-out_infinite]");

    node.append("g")
      .attr("transform", "translate(-12, -12) scale(0.09375)")
      .html(d => ICONS[d.type as DeviceType] || ICONS[DeviceType.TPLINK])
      .attr("fill", d => {
        switch(d.status) {
          case ConnectionStatus.CANCELLED: return "#334155";
          case ConnectionStatus.OFFLINE:
          case ConnectionStatus.FAULT: return "#f43f5e";
          case ConnectionStatus.WARNING: return "#fbbf24";
          case ConnectionStatus.NON_PAYMENT: return "#f97316";
          case ConnectionStatus.SUSPENDED: return "#a855f7";
          default: return "#f8fafc";
        }
      });

    const labels = node.append("g").attr("transform", d => `translate(0, ${d.type === DeviceType.CORE_ROUTER ? 52 : 42})`);
    labels.append("text")
      .text(d => d.name)
      .attr("text-anchor", "middle")
      .attr("fill", d => d.status === ConnectionStatus.CANCELLED ? "#334155" : "#f1f5f9")
      .attr("font-size", "10px")
      .attr("font-weight", "bold")
      .attr("class", "pointer-events-none uppercase tracking-tighter");

    labels.append("text")
      .text(d => {
        if (d.status === ConnectionStatus.CANCELLED) return "BAJA DEFINITIVA";
        if (d.status === ConnectionStatus.OFFLINE) return "OFFLINE";
        if (d.status === ConnectionStatus.FAULT) return "AVERÍA";
        if (d.status === ConnectionStatus.NON_PAYMENT) return "FALTA PAGO";
        return d.ip;
      })
      .attr("dy", 12)
      .attr("text-anchor", "middle")
      .attr("fill", d => {
        if (d.status === ConnectionStatus.CANCELLED) return "#1e293b";
        if (d.status === ConnectionStatus.OFFLINE || d.status === ConnectionStatus.FAULT) return "#f43f5e";
        if (d.status === ConnectionStatus.WARNING) return "#f59e0b";
        return "#64748b";
      })
      .attr("font-size", "9px")
      .attr("class", "pointer-events-none mono");

    simulation.on("tick", () => {
      link.attr("x1", d => (d.source as any).x).attr("y1", d => (d.source as any).y).attr("x2", d => (d.target as any).x).attr("y2", d => (d.target as any).y);
      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    return () => { simulation.stop(); };
  }, [visibleNodes, visibleLinks, expandedSites, onToggleSite, onSelectDevice]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-slate-950/40 rounded-3xl overflow-hidden border border-slate-800/50 shadow-[inset_0_2px_20px_rgba(0,0,0,0.5)]" onClick={() => setSelectedDeviceId(null)}>
      {/* (Resto del JSX del mapa igual) */}
      <svg ref={svgRef} className="w-full h-full cursor-move active:cursor-grabbing" />
      <div className="absolute bottom-6 left-6 z-10 flex flex-col items-start gap-2 pointer-events-none">
        <p className="text-[10px] text-slate-500 font-mono bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800 uppercase">
          MODO ISP • STATUS DYNAMICS
        </p>
      </div>
    </div>
  );
};

export default TopologyMap;
