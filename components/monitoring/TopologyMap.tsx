
import React, { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { NetworkDevice, DeviceType, ConnectionStatus, NetworkSite } from '../../types/monitoring';
import { analyzeNetworkIssue } from '../../services/geminiService';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet Default Icon in Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface TopologyMapProps {
  devices: NetworkDevice[];
  sites: NetworkSite[];
  onSelectDevice: (device: NetworkDevice) => void;

  expandedSites: Set<string>;
  onToggleSite: (siteId: string) => void;
  onUpdateDevicePosition?: (id: string, lat: number, lng: number) => void;
  onUpdateLinkRoute?: (deviceId: string, targetId: string, route: { lat: number; lng: number }[]) => void;
}

interface TopologyNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  isSite: boolean;
  originalId?: string;
  type?: DeviceType;
  status?: ConnectionStatus;
  ip?: string;
  siteId?: string;
  depth: number;
}

interface TopologyLink extends d3.SimulationLinkDatum<TopologyNode> {
  source: string | TopologyNode;
  target: string | TopologyNode;
  value: number;
  isOffline?: boolean;
  isCancelled?: boolean;
  isHierarchy?: boolean;
}

// Icon paths assume a 256x256 viewbox
const ICONS = {
  [DeviceType.CORE_ROUTER]: `
    <rect x="32" y="80" width="192" height="96" rx="16" fill="none" stroke="currentColor" stroke-width="12"/>
    <path d="M72,128h112M128,80v96" stroke="currentColor" stroke-width="8" stroke-dasharray="12,8"/>
    <circle cx="128" cy="128" r="32" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="4"/>
    <path d="M128,40l20,40h-40z M128,216l20-40h-40z M216,128l-40,20v-40z M40,128l40,20v-40z" fill="currentColor"/>
  `,
  [DeviceType.SWITCH]: `
    <rect x="24" y="60" width="208" height="136" rx="12" fill="none" stroke="currentColor" stroke-width="12"/>
    <rect x="48" y="90" width="32" height="32" rx="4" fill="currentColor" fill-opacity="0.4"/>
    <rect x="96" y="90" width="32" height="32" rx="4" fill="currentColor" fill-opacity="0.4"/>
    <rect x="144" y="90" width="32" height="32" rx="4" fill="currentColor" fill-opacity="0.4"/>
    <rect x="192" y="90" width="32" height="32" rx="4" fill="currentColor" fill-opacity="0.4"/>
    <path d="M48,150h160" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
    <circle cx="56" cy="150" r="4" fill="currentColor"/>
    <circle cx="104" cy="150" r="4" fill="currentColor"/>
    <circle cx="152" cy="150" r="4" fill="currentColor"/>
    <circle cx="200" cy="150" r="4" fill="currentColor"/>
  `,
  [DeviceType.OLT]: `
    <path d="M40,60h176v136h-176z" fill="none" stroke="currentColor" stroke-width="12"/>
    <path d="M40,100h176 M40,140h176 M40,180h176" stroke="currentColor" stroke-width="8" opacity="0.5"/>
    <path d="M70,70v110 M110,70v110 M150,70v110 M190,70v110" stroke="currentColor" stroke-width="4" stroke-dasharray="4,4"/>
    <circle cx="55" cy="80" r="6" fill="#10b981"/>
    <circle cx="55" cy="120" r="6" fill="#10b981"/>
    <circle cx="55" cy="160" r="6" fill="#f43f5e"/>
  `,
  [DeviceType.TPLINK]: `
    <path d="M128,40 L220,120 L190,120 L190,210 L66,210 L66,120 L36,120 Z" fill="none" stroke="currentColor" stroke-width="12"/>
    <circle cx="128" cy="140" r="24" fill="none" stroke="currentColor" stroke-width="8"/>
    <path d="M110,140a18,18,0,0,1,36,0" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>
    <path d="M128,90v20 M90,128h20 M166,128h20" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
  `,
  [DeviceType.ODF]: `
    <rect x="40" y="30" width="176" height="196" rx="8" fill="none" stroke="currentColor" stroke-width="12"/>
    <path d="M70,60h116 M70,90h116 M70,120h116 M70,150h116 M70,180h116" stroke="currentColor" stroke-width="6" stroke-dasharray="4,8"/>
    <circle cx="60" cy="60" r="4" fill="currentColor"/>
    <circle cx="60" cy="90" r="4" fill="currentColor"/>
    <circle cx="60" cy="120" r="4" fill="currentColor"/>
    <circle cx="60" cy="150" r="4" fill="currentColor"/>
    <circle cx="60" cy="180" r="4" fill="currentColor"/>
  `,
  [DeviceType.GATEWAY]: `
    <path d="M30,128h196M128,30v196" stroke="currentColor" stroke-width="12"/>
    <circle cx="128" cy="128" r="60" fill="none" stroke="currentColor" stroke-width="12"/>
    <path d="M128,68a60,60,0,0,1,60,60M128,188a60,60,0,0,1-60-60" stroke="currentColor" stroke-width="8" stroke-linecap="round" opacity="0.5"/>
  `,
  [DeviceType.SPLITTER]: `
    <path d="M40,128 L100,60 L100,196 Z" fill="none" stroke="currentColor" stroke-width="12"/>
    <path d="M100,128 L216,60 M100,128 L216,100 M100,128 L216,140 M100,128 L216,196" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
    <circle cx="100" cy="128" r="8" fill="currentColor"/>
  `,
  SITE: `
    <path d="M128,30 L213,79 L213,177 L128,226 L43,177 L43,79 Z" fill="none" stroke="currentColor" stroke-width="14"/>
    <circle cx="128" cy="128" r="45" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="8"/>
    <path d="M128,95v20 M128,141v20 M95,128h20 M141,128h20" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>
  `
};

const TopologyMap: React.FC<TopologyMapProps> = ({ devices, sites, onSelectDevice, expandedSites, onToggleSite, onUpdateDevicePosition, onUpdateLinkRoute }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [isPinging, setIsPinging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  const [isMapMode, setIsMapMode] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  const [expandedSplitters, setExpandedSplitters] = useState<Set<string>>(new Set());
  const [selectedLink, setSelectedLink] = useState<{ source: string, target: string } | null>(null);

  // Persistent Storage for Data & Physics
  const nodesRef = useRef<TopologyNode[]>([]);
  const linksRef = useRef<TopologyLink[]>([]);
  const simulationRef = useRef<d3.Simulation<TopologyNode, TopologyLink> | null>(null);

  // Persistent Positions Storage
  const [savedPositions, setSavedPositions] = useState<Record<string, { x: number, y: number }>>(() => {
    try {
      const saved = localStorage.getItem('topology-node-positions');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('topology-node-positions', JSON.stringify(savedPositions));
  }, [savedPositions]);

  const activeSelectedDevice = useMemo(() =>
    selectedDeviceId ? devices.find(d => d.id === selectedDeviceId) || null : null
    , [devices, selectedDeviceId]);

  const visibleNodes = useMemo(() => {
    const nodes: any[] = [];
    const siteDepthMap: Record<string, number> = {};

    // Helper para calcular profundidad de sitio
    const getSiteDepth = (siteId: string): number => {
      if (siteDepthMap[siteId] !== undefined) return siteDepthMap[siteId];
      const site = sites.find(s => s.id === siteId);
      if (!site || !site.parentId) {
        siteDepthMap[siteId] = 0;
        return 0;
      }
      const depth = getSiteDepth(site.parentId) + 1;
      siteDepthMap[siteId] = depth;
      return depth;
    };

    // Pre-calcular profundidades de sitios
    sites.forEach(s => getSiteDepth(s.id));

    // Incluir sitios visibles
    sites.forEach(s => {
      const isVisible = !s.parentId || expandedSites.has(s.parentId);
      if (isVisible) {
        nodes.push({
          ...s,
          isSite: true,
          id: `site-${s.id}`,
          originalId: s.id,
          depth: siteDepthMap[s.id] * 2 // Multiplicador para dar espacio entre niveles de sitio
        });
      }
    });

    // Helper to find parent splitter for a client
    const getParentSplitterId = (device: NetworkDevice) => {
      if (device.type !== DeviceType.TPLINK) return null;
      // Find the link that connects to a splitter
      for (const linkId of device.links) {
        const linkedDevice = devices.find(d => d.id === linkId);
        if (linkedDevice && linkedDevice.type === DeviceType.SPLITTER) {
          return linkedDevice.id;
        }
      }
      return null;
    };

    // Calculate compressed clients count per splitter
    const splitterClientCounts: Record<string, number> = {};
    devices.forEach(d => {
      if (d.type === DeviceType.TPLINK) {
        const parentId = getParentSplitterId(d);
        if (parentId) {
          splitterClientCounts[parentId] = (splitterClientCounts[parentId] || 0) + 1;
        }
      }
    });

    // Incluir dispositivos visibles
    devices.forEach(d => {
      // Logic for standard visibility based on Site expansion
      if (d.type === DeviceType.CORE_ROUTER || expandedSites.has(d.siteId)) {

        // CHECK SPLITTER COMPRESSION
        let isVisible = true;
        if (d.type === DeviceType.TPLINK) {
          const parentSplitterId = getParentSplitterId(d);
          if (parentSplitterId && !expandedSplitters.has(parentSplitterId)) {
            isVisible = false;
          }
        }

        if (isVisible) {
          let nodeDepth = (siteDepthMap[d.siteId] || 0) * 2 + 1;

          // Ajuste fino según tipo de hardware para sub-niveles internos del sitio
          if (d.type === DeviceType.OLT || d.type === DeviceType.SWITCH) nodeDepth += 1;
          if (d.type === DeviceType.ODF) nodeDepth += 2;
          if (d.type === DeviceType.SPLITTER) nodeDepth += 3;
          if (d.type === DeviceType.TPLINK) nodeDepth += 4;

          const savedPos = savedPositions[d.isSite ? `site-${d.originalId || d.id}` : d.id];

          const nodeData: any = {
            ...d,
            isSite: false,
            depth: nodeDepth,
            fx: savedPos?.x ?? null,
            fy: savedPos?.y ?? null,
          };

          // Add client count if it's a splitter
          if (d.type === DeviceType.SPLITTER) {
            nodeData.clientCount = splitterClientCounts[d.id] || 0;
            nodeData.isExpanded = expandedSplitters.has(d.id);
          }

          nodes.push(nodeData);
        }
      }
    });

    // Apply saved positions to sites too
    nodes.forEach(n => {
      if (n.isSite) {
        const savedPos = savedPositions[n.id];
        if (savedPos) {
          n.fx = savedPos.x;
          n.fy = savedPos.y;
        }
      }
    });

    return nodes;
  }, [devices, sites, expandedSites, savedPositions, expandedSplitters]);

  const visibleLinks = useMemo(() => {
    const links: any[] = [];
    const seen = new Set<string>();
    const visibleIds = new Set(visibleNodes.map(n => n.id));

    // 1. Enlaces entre dispositivos (reales o configurados)
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

      // 2. Jerarquía Inteligente: Sitio -> Core -> Otros Equipos
      const siteNodeId = `site-${d.siteId}`;
      if (visibleIds.has(siteNodeId)) {
        if (d.type === DeviceType.CORE_ROUTER) {
          // Si es un Core, se une directamente al Sitio
          links.push({ source: siteNodeId, target: d.id, isHierarchy: true, value: 0.5 });
        } else {
          // Si no es un Core, buscamos si hay un Core en el mismo sitio
          const siteCore = devices.find(x => x.siteId === d.siteId && x.type === DeviceType.CORE_ROUTER);
          if (siteCore && visibleIds.has(siteCore.id)) {
            // Se une al Core de su propio sitio
            links.push({ source: siteCore.id, target: d.id, isHierarchy: true, value: 0.3 });
          } else {
            // Si no hay Core, se une al Sitio directamente
            links.push({ source: siteNodeId, target: d.id, isHierarchy: true, value: 0.5 });
          }
        }
      }
    });

    // 3. Enlaces entre sitios (jerarquía) y Backbone Global
    const mainCore = devices.find(d => d.type === DeviceType.CORE_ROUTER);
    sites.forEach(s => {
      if (s.parentId) {
        const sourceId = `site-${s.parentId}`;
        const targetId = `site-${s.id}`;
        if (visibleIds.has(sourceId) && visibleIds.has(targetId)) {
          links.push({ source: sourceId, target: targetId, isHierarchy: true, value: 2 });
        }
      } else if (mainCore && mainCore.siteId !== s.id && visibleIds.has(mainCore.id)) {
        // Si el sitio no tiene padre y no es el sitio del Core principal, 
        // lo unimos al Core principal como "Backbone"
        const targetId = `site-${s.id}`;
        if (visibleIds.has(targetId)) {
          links.push({ source: mainCore.id, target: targetId, isHierarchy: true, value: 3 });
        }
      }
    });

    return links;
  }, [devices, sites, visibleNodes]);

  // Synchronize Persistent Objects
  useEffect(() => {
    // 1. Update Nodes without losing state
    nodesRef.current = visibleNodes.map(v => {
      const existing = nodesRef.current.find(n => n.id === v.id);
      if (existing) {
        // Keep coordinates and physics, update data
        return Object.assign(existing, v);
      }
      return v;
    });

    // 2. Update Links
    linksRef.current = visibleLinks.map(l => {
      const sId = typeof l.source === 'string' ? l.source : (l.source as any).id;
      const tId = typeof l.target === 'string' ? l.target : (l.target as any).id;

      const existing = linksRef.current.find(ex => {
        const exS = typeof ex.source === 'string' ? ex.source : (ex.source as any).id;
        const exT = typeof ex.target === 'string' ? ex.target : (ex.target as any).id;
        return exS === sId && exT === tId;
      });

      if (existing) return Object.assign(existing, l);
      return { ...l }; // Clone to avoid mutation issues
    });

    // 3. Update Simulation if it exists
    if (simulationRef.current) {
      simulationRef.current.nodes(nodesRef.current);
      (simulationRef.current.force("link") as d3.ForceLink<TopologyNode, TopologyLink>).links(linksRef.current);
      simulationRef.current.alpha(0.3).restart();
    }
  }, [visibleNodes, visibleLinks]);

  const nodesIdKey = useMemo(() => visibleNodes.map(n => n.id).sort().join(','), [visibleNodes]);
  const linksIdKey = useMemo(() => visibleLinks.map(l => {
    const sId = typeof l.source === 'string' ? l.source : (l.source as any).id;
    const tId = typeof l.target === 'string' ? l.target : (l.target as any).id;
    return `${sId}-${tId}`;
  }).sort().join(','), [visibleLinks]);

  const activePathIds = useMemo(() => {
    if (!selectedDeviceId) return null;

    const pathNodes = new Set<string>();
    const pathLinks = new Set<string>();

    const queue: string[] = [selectedDeviceId];
    const visited = new Set<string>();
    const parentMap = new Map<string, { parent: string, linkId: string }>();

    visited.add(selectedDeviceId);

    let foundCore = false;
    let targetCoreId = 's1-router'; // Hardcoded target for "Central Core"

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current === targetCoreId) {
        let temp = current;
        pathNodes.add(temp);
        while (temp !== selectedDeviceId) {
          const entry = parentMap.get(temp)!;
          pathLinks.add(entry.linkId);
          temp = entry.parent;
          pathNodes.add(temp);
        }
        foundCore = true;
        break;
      }

      visibleLinks.forEach(link => {
        const sId = typeof link.source === 'string' ? link.source : (link.source as any).id;
        const tId = typeof link.target === 'string' ? link.target : (link.target as any).id;
        const linkId = [sId, tId].sort().join('-');

        if (sId === current && !visited.has(tId)) {
          visited.add(tId);
          parentMap.set(tId, { parent: sId, linkId });
          queue.push(tId);
        } else if (tId === current && !visited.has(sId)) {
          visited.add(sId);
          parentMap.set(sId, { parent: tId, linkId });
          queue.push(sId);
        }
      });
    }

    // If target core not found, try to find ANY core as fallback
    if (!foundCore) {
      // (Fallback logic remains similar if needed, but for this project s1-router is the root)
      pathNodes.add(selectedDeviceId);
    }

    return { nodes: pathNodes, links: pathLinks };
  }, [selectedDeviceId, visibleLinks, devices]);

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

    // D3 Setup (Defs, Zoom, Forces)
    let defs = svg.select("defs");
    if (defs.empty()) {
      defs = svg.append("defs");
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
      createGlow("glow-fault", "#f43f5e", "6");
    }

    let g = svg.select<SVGGElement>("g.zoom-container");
    if (g.empty()) {
      g = svg.append("g").attr("class", "zoom-container");
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.2, 4])
        .on("zoom", (event) => g.attr("transform", event.transform));
      svg.call(zoom);
    }

    const maxDepth = Math.max(...visibleNodes.map(n => n.depth), 1);
    const ringSpace = Math.min(width, height) / (maxDepth * 2.5);

    const simulation = d3.forceSimulation<TopologyNode>(nodesRef.current)
      .alphaDecay(0.12)
      .velocityDecay(0.6)
      .force("link", d3.forceLink<TopologyNode, TopologyLink>(linksRef.current).id(d => d.id).distance(d => {
        if (d.isHierarchy) {
          if (d.value === 3) return ringSpace * 0.7;
          if (d.value === 2) return ringSpace * 0.5;
          if (d.value === 0.3) return 30;
          if (d.value === 0.5) return 0;
          return 40;
        }
        return d.isOffline ? 300 : (d.value === 4 ? 100 : 80);
      }).strength(d => d.isHierarchy ? 1.0 : (d.isOffline ? 0.05 : 0.8)))
      .force("charge", d3.forceManyBody().strength((d: any) => {
        if (d.isSite) return -3000;
        return d.status === ConnectionStatus.OFFLINE ? -500 : (d.type === DeviceType.CORE_ROUTER ? -5000 : -2000);
      }))
      .force("center", d3.forceCenter(centerX, centerY).strength(0.05))
      .force("radial", d3.forceRadial((d: any) => d.depth * ringSpace, centerX, centerY).strength(1.5))
      .force("collision", d3.forceCollide().radius((d: any) => d.isSite ? 120 : (d.type === DeviceType.CORE_ROUTER ? 60 : 40)));

    simulationRef.current = simulation;

    // Site Container "Bubbles"
    const siteContainers = nodesRef.current.filter(n => n.isSite);
    const siteBubble = g.selectAll<SVGCircleElement, any>("circle.site-bubble")
      .data(siteContainers, (d: any) => d.id)
      .join("circle")
      .attr("class", "site-bubble")
      .attr("fill", "#6366f1")
      .attr("fill-opacity", 0.03)
      .attr("stroke", "#6366f1")
      .attr("stroke-width", 1)
      .attr("stroke-opacity", 0.1)
      .attr("stroke-dasharray", "10,5")
      .attr("pointer-events", "none");

    const link = g.selectAll<SVGLineElement, any>("line.link-element")
      .data(linksRef.current, (d: any) => {
        const sId = typeof d.source === 'string' ? d.source : (d.source as any).id;
        const tId = typeof d.target === 'string' ? d.target : (d.target as any).id;
        return [sId, tId].sort().join('-');
      })
      .join("line")
      .attr("class", "link-element")
      .attr("stroke", (d: any) => {
        if (d.isHierarchy) return "#334155";
        return d.isCancelled ? "#1e293b" : (d.isOffline ? "#334155" : (d.value === 4 ? "#6366f1" : "#475569"));
      })
      .attr("stroke-opacity", (d: any) => d.isHierarchy ? 0.3 : (d.isCancelled ? 0.1 : (d.isOffline ? 0.2 : 0.6)))
      .attr("stroke-width", (d: any) => d.value === 4 ? 3 : (d.isHierarchy ? 1 : 1.5))
      .attr("stroke-dasharray", (d: any) => d.isHierarchy ? "4,2" : (d.value === 4 ? "none" : "6,3"));

    const node = g.selectAll<SVGGElement, any>("g.node-group")
      .data(nodesRef.current, (d: any) => d.id)
      .join(
        enter => {
          const nodeEnter = enter.append("g")
            .attr("class", "node-group")
            .style("cursor", "pointer")
            .on("click", (event, d: any) => {
              if (d.isSite) {
                onToggleSite(d.originalId);
              } else {
                if (d.type === DeviceType.SPLITTER) {
                  setExpandedSplitters(prev => {
                    const next = new Set(prev);
                    if (next.has(d.id)) next.delete(d.id);
                    else next.add(d.id);
                    return next;
                  });
                } else {
                  if (d.type === DeviceType.CORE_ROUTER) onToggleSite(d.siteId);
                  onSelectDevice(d);
                  setSelectedDeviceId(d.id);
                  setAiAnalysis(null);
                }
              }
              event.stopPropagation();
            })
            .call(d3.drag<any, any>()
              .on("start", (event, d) => {
                if (!event.active) simulation.alphaTarget(0.2).restart();
                d.fx = d.x; d.fy = d.y;
              })
              .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
              .on("end", (event, d) => {
                if (!event.active) simulation.alphaTarget(0);
                setSavedPositions(prev => ({ ...prev, [d.id]: { x: event.x, y: event.y } }));
              }));

          nodeEnter.append("circle").attr("class", "outer-ring").attr("fill", "none").attr("stroke-width", 1).attr("stroke-dasharray", "4,4");
          nodeEnter.append("circle").attr("class", "main-circle");
          nodeEnter.append("g").attr("class", "icon-container").attr("transform", "translate(-12, -12) scale(0.09375)");

          const labelsEnter = nodeEnter.append("g").attr("class", "labels-container");
          labelsEnter.append("text").attr("class", "name-label").attr("text-anchor", "middle").attr("font-size", "11px").attr("font-weight", "900").attr("class", "pointer-events-none uppercase tracking-widest name-label");
          labelsEnter.append("text").attr("class", "status-label").attr("dy", 12).attr("text-anchor", "middle").attr("font-size", "9px").attr("class", "pointer-events-none mono status-label");

          // Badge for Splitter Client Count
          const badgeGroup = labelsEnter.append("g").attr("class", "client-badge").style("display", "none");
          badgeGroup.append("circle").attr("r", 9).attr("fill", "#6366f1").attr("cy", -15).attr("stroke", "#020617").attr("stroke-width", 2);
          badgeGroup.append("text").attr("dy", -12).attr("text-anchor", "middle").attr("fill", "white").attr("font-size", "10px").attr("font-weight", "bold");

          return nodeEnter;
        }
      );

    node.select("circle.outer-ring").attr("r", (d: any) => d.isSite ? 34 : 0).attr("stroke", (d: any) => d.status === ConnectionStatus.FAULT ? "#f43f5e" : "#818cf8").attr("opacity", (d: any) => d.isSite ? 0.3 : 0);
    node.select("circle.main-circle")
      .attr("r", (d: any) => d.isSite ? 26 : (d.type === DeviceType.CORE_ROUTER ? 32 : 24))
      .attr("fill", (d: any) => {
        if (d.isSite) return "rgba(15, 23, 42, 0.8)";
        if (d.status === ConnectionStatus.ONLINE) return "rgba(99, 102, 241, 0.1)";
        if (d.status === ConnectionStatus.FAULT) return "rgba(244, 63, 94, 0.2)";
        if (d.status === ConnectionStatus.OFFLINE) return "rgba(239, 68, 68, 0.1)";
        return "rgba(15, 23, 42, 0.8)";
      })
      .attr("stroke", (d: any) => {
        if (d.isSite) return "#475569";
        if (d.status === ConnectionStatus.FAULT) return "#f43f5e";
        if (d.status === ConnectionStatus.OFFLINE) return "#ef4444";
        return "#6366f1";
      })
      .attr("stroke-width", (d: any) => d.isSite ? 1 : 2)
      .attr("filter", (d: any) => {
        if (d.isSite) return null;
        if (d.status === ConnectionStatus.ONLINE) return "url(#glow-online)";
        if (d.status === ConnectionStatus.FAULT) return "url(#glow-fault)";
        if (d.status === ConnectionStatus.OFFLINE) return "url(#glow-offline)";
        return null;
      });

    node.select("g.icon-container")
      .html((d: any) => d.isSite ? ICONS.SITE : (ICONS[d.type as DeviceType] || ICONS[DeviceType.TPLINK]))
      .attr("fill", (d: any) => {
        if (d.isSite) return "#cbd5e1";
        if (d.status === ConnectionStatus.FAULT) return "#f43f5e";
        if (d.status === ConnectionStatus.OFFLINE) return "#ef4444";
        return "#818cf8";
      });
    node.select("g.labels-container").attr("transform", (d: any) => `translate(0, ${d.isSite ? 52 : (d.type === DeviceType.CORE_ROUTER ? 52 : 44)})`);
    node.select("text.name-label").text((d: any) => d.name).attr("fill", (d: any) => d.isSite ? "#818cf8" : "#f1f5f9");
    node.select("text.status-label").text((d: any) => d.isSite ? "SITE" : d.ip).attr("fill", "#64748b");

    // Update Badge
    node.select("g.client-badge")
      .style("display", (d: any) => d.type === DeviceType.SPLITTER && !d.isExpanded && d.clientCount > 0 ? "block" : "none")
      .select("text").text((d: any) => d.clientCount);

    simulation.on("tick", () => {
      nodesRef.current.forEach((d: any) => {
        const r = d.isSite ? 80 : 40;
        d.x = Math.max(r, Math.min(width - r, d.x));
        d.y = Math.max(r, Math.min(height - r, d.y));
      });

      link.attr("x1", (d: any) => (d.source as any).x).attr("y1", (d: any) => (d.source as any).y).attr("x2", (d: any) => (d.target as any).x).attr("y2", (d: any) => (d.target as any).y);
      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
      siteBubble.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y).attr("r", (d: any) => 120);
    });

    return () => {
      simulation.stop();
      simulationRef.current = null;
    };
  }, [nodesIdKey, linksIdKey, expandedSites, onToggleSite, onSelectDevice]);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const g = svg.select("g.zoom-container");
    if (g.empty()) return;

    g.selectAll<SVGLineElement, any>("line")
      .transition().duration(200)
      .attr("stroke", (d: any) => {
        if (activePathIds) {
          const sId = typeof d.source === 'string' ? d.source : (d.source as any).id;
          const tId = typeof d.target === 'string' ? d.target : (d.target as any).id;
          const linkId = [sId, tId].sort().join('-');
          if (activePathIds.links.has(linkId)) return "#22c55e";
        }
        return "#475569";
      })
      .attr("stroke-opacity", (d: any) => activePathIds ? (activePathIds.links.has([typeof d.source === 'string' ? d.source : (d.source as any).id, typeof d.target === 'string' ? d.target : (d.target as any).id].sort().join('-')) ? 1.0 : 0.05) : 0.6);

    g.selectAll<SVGGElement, any>("g.node-group")
      .transition().duration(300)
      .attr("opacity", (d: any) => activePathIds ? (activePathIds.nodes.has(d.id) ? 1.0 : 0.1) : 1.0);
  }, [activePathIds, nodesIdKey, linksIdKey]);

  const renderMap = () => {
    // Default Center (Lima, Peru)
    const centerPos: [number, number] = [-12.046374, -77.042793];

    // Logic to show ALL valid nodes in map mode, providing fallback coords if missing
    // We can distribute them randomly near the center initially if needed, 
    // or just stack them at center (user drags them out).
    const mapNodes = visibleNodes.map((n, i) => {
      if (n.latitude && n.longitude) return n;
      // Assign default grid position if missing, to prevent stacking
      const offset = 0.002;
      const col = i % 10;
      const row = Math.floor(i / 10);
      return {
        ...n,
        latitude: centerPos[0] - (row * offset),
        longitude: centerPos[1] + (col * offset),
        isDefaultPos: true
      };
    });

    return (
      <MapContainer
        center={centerPos}
        zoom={13}
        style={{ height: '100%', width: '100%', background: '#0f172a' }}
        ref={mapRef}
        onClick={() => setSelectedLink(null)} // Deselect link on map click
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* LINKS */}
        {visibleLinks.map((link, idx) => {
          const sId = typeof link.source === 'string' ? link.source : (link.source as any).id;
          const tId = typeof link.target === 'string' ? link.target : (link.target as any).id;

          const sourceNode = mapNodes.find(n => n.id === sId);
          const targetNode = mapNodes.find(n => n.id === tId);

          if (sourceNode?.latitude && sourceNode?.longitude && targetNode?.latitude && targetNode?.longitude) {
            // Check for existing route
            // Note: linkRoutes is stored on the Device object. sourceNode includes device props.
            // We need to check both directions because the link might be defined on either, 
            // but in our data model `links` array is on the source device.
            // visibleLinks constructs the link based on that.

            // However, `mapNodes` are derived from `visibleNodes`, which come from `devices`.
            // Let's find the original device to get the route.
            const sourceDevice = devices.find(d => d.id === sourceNode.id);
            const route = sourceDevice?.linkRoutes?.[targetNode.id] || [];

            const isSelected = selectedLink?.source === sId && selectedLink?.target === tId;

            const positions: [number, number][] = [
              [sourceNode.latitude, sourceNode.longitude],
              ...route.map(p => [p.lat, p.lng] as [number, number]),
              [targetNode.latitude, targetNode.longitude]
            ];

            return (
              <React.Fragment key={`link-group-${idx}`}>
                <Polyline
                  positions={positions}
                  pathOptions={{
                    color: link.isOffline ? '#ef4444' : (link.value === 4 ? '#6366f1' : '#64748b'),
                    weight: isSelected ? 4 : (link.value === 4 ? 3 : 2),
                    opacity: isSelected ? 1 : 0.6,
                    dashArray: link.isOffline ? '5, 5' : undefined
                  }}
                  eventHandlers={{
                    click: (e) => {
                      L.DomEvent.stopPropagation(e);
                      setSelectedLink({ source: sId, target: tId });

                      // Add new point on Ctrl+Click
                      if (e.originalEvent.ctrlKey && onUpdateLinkRoute && sourceDevice) {
                        const newLat = e.latlng.lat;
                        const newLng = e.latlng.lng;

                        // Simple insertion logic: find closest segment and insert
                        // For now, just append to end? No, that's bad.
                        // Let's just push to the list and let the user drag it?
                        // Or try to inject based on index?
                        // Let's just add it to the route.
                        const newRoute = [...route, { lat: newLat, lng: newLng }];
                        onUpdateLinkRoute(sourceNode.id, targetNode.id, newRoute);
                      }
                    }
                  }}
                />

                {/* Render "Poles" (Intermediate Points) if Selected */}
                {isSelected && route.map((point, pIdx) => (
                  <Marker
                    key={`pole-${idx}-${pIdx}`}
                    position={[point.lat, point.lng]}
                    draggable={true}
                    icon={L.divIcon({
                      className: 'pole-icon',
                      html: `<div style="width: 12px; height: 12px; background: #fbbf24; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
                      iconSize: [12, 12],
                      iconAnchor: [6, 6]
                    })}
                    eventHandlers={{
                      dragend: (e) => {
                        const marker = e.target;
                        const newPos = marker.getLatLng();
                        const newRoute = [...route];
                        newRoute[pIdx] = { lat: newPos.lat, lng: newPos.lng };
                        if (onUpdateLinkRoute) {
                          onUpdateLinkRoute(sourceNode.id, targetNode.id, newRoute);
                        }
                      },
                      contextmenu: (e) => {
                        const newRoute = route.filter((_, i) => i !== pIdx);
                        if (onUpdateLinkRoute) {
                          onUpdateLinkRoute(sourceNode.id, targetNode.id, newRoute);
                        }
                      }
                    }}
                  />
                ))}
              </React.Fragment>
            )
          }
          return null;
        })}

        {/* NODES */}
        {mapNodes.map(node => {
          if (!node.latitude || !node.longitude) return null;

          // Custom DivIcon based on existing SVG ICONS
          const iconHtml = node.isSite ? ICONS.SITE : (ICONS[node.type as DeviceType] || ICONS[DeviceType.TPLINK]);
          const color = node.status === ConnectionStatus.FAULT ? '#f43f5e' : (node.status === ConnectionStatus.OFFLINE ? '#94a3b8' : '#6366f1');

          const customIcon = L.divIcon({
            className: 'custom-map-icon',
            html: `<div style="
                    background-color: #0f172a; 
                    border: 2px solid ${color}; 
                    border-radius: 50%; 
                    width: 30px; 
                    height: 30px; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
                ">
                    <svg viewBox="0 0 256 256" width="18" height="18" fill="none" stroke="${color}" stroke-width="20" style="width: 18px; height: 18px;">
                        ${iconHtml}
                    </svg>
                </div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          });

          return (
            <Marker
              key={node.id}
              position={[node.latitude, node.longitude]}
              icon={customIcon}
              draggable={true} // Enabled for all nodes per user request
              eventHandlers={{
                click: (e) => {
                  if (node.isSite) {
                    onToggleSite(node.originalId);
                  } else {
                    if (node.type === DeviceType.SPLITTER) {
                      setExpandedSplitters(prev => {
                        const next = new Set(prev);
                        if (next.has(node.id)) next.delete(node.id);
                        else next.add(node.id);
                        return next;
                      });
                    } else {
                      if (node.type === DeviceType.CORE_ROUTER) onToggleSite(node.siteId);
                      onSelectDevice(node);
                      setSelectedDeviceId(node.id);
                    }
                  }
                },
                dragend: (e) => {
                  const marker = e.target;
                  const position = marker.getLatLng();
                  // Assuming onUpdateDevicePosition is passed as a prop
                  // You'll need to add onUpdateDevicePosition to the component's props
                  // e.g., const TopologyMap = ({ ..., onUpdateDevicePosition }) => { ... }
                  if (onUpdateDevicePosition) {
                    onUpdateDevicePosition(node.id, position.lat, position.lng);
                  }
                }
              }}
            >
            </Marker>
          );
        })}
      </MapContainer>
    );
  };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-slate-950/40 rounded-3xl overflow-hidden border border-slate-800/50 shadow-[inset_0_2px_20px_rgba(0,0,0,0.5)]" onClick={() => setSelectedDeviceId(null)}>

      {isMapMode ? renderMap() : (
        <svg ref={svgRef} className="w-full h-full cursor-move active:cursor-grabbing" />
      )}

      {/* Legend & Stats Overlay */}
      <div className="absolute top-6 left-6 z-10 space-y-4 pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/50 p-4 rounded-2xl shadow-2xl">
          <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-3">Leyenda de Equipos</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
              <span className="text-slate-300 text-[10px] font-medium">Core Router</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <span className="text-slate-300 text-[10px] font-medium">OLT Aggregator</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-500"></div>
              <span className="text-slate-300 text-[10px] font-medium">Switch / ODF</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.6)]"></div>
              <span className="text-rose-400 text-[10px] font-bold">Avería Detectada</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Device Action Panel */}
      {activeSelectedDevice && (
        <div className="absolute bottom-6 right-6 z-10 w-80 pointer-events-auto" onClick={e => e.stopPropagation()}>
          <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 p-5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full -mr-12 -mt-12 blur-3xl"></div>

            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1 block">Detalles del Equipo</span>
                <h4 className="text-white text-lg font-bold leading-tight">{activeSelectedDevice.name}</h4>
                <p className="text-slate-400 font-mono text-xs mt-1">{activeSelectedDevice.ip}</p>
              </div>
              <div className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${activeSelectedDevice.status === ConnectionStatus.ONLINE ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                {activeSelectedDevice.status}
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500">Uptime</span>
                <span className="text-slate-200 font-mono">{activeSelectedDevice.stats?.uptime || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500">Carga CPU</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1 rounded-full bg-slate-800">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${activeSelectedDevice.stats?.cpu || 0}%` }}></div>
                  </div>
                  <span className="text-slate-200 font-mono">{activeSelectedDevice.stats?.cpu || 0}%</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500">Tráfico</span>
                <span className="text-slate-200 font-mono">↑ {activeSelectedDevice.stats?.trafficOut || '0Mbps'} ↓ {activeSelectedDevice.stats?.trafficIn || '0Mbps'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handlePing}
                disabled={isPinging}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${isPinging ? 'bg-slate-800 text-slate-500' : 'bg-slate-800 text-white hover:bg-slate-700 active:scale-95'
                  }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isPinging ? 'bg-white animate-ping' : 'bg-indigo-400'}`}></span>
                {isPinging ? 'Pinging...' : 'Test Latencia'}
              </button>
              <button
                onClick={handleAIAnalyze}
                disabled={isAnalyzing}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 hover:shadow-[0_0_15px_rgba(79,70,229,0.4)] active:scale-95 transition-all disabled:opacity-50"
              >
                <svg className={`w-3 h-3 ${isAnalyzing ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" strokeLinecap="round" />
                </svg>
                {isAnalyzing ? 'IA Thinking...' : 'Diagnóstico IA'}
              </button>
            </div>

            {aiAnalysis && (
              <div className="mt-4 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                <p className="text-[10px] text-indigo-300 font-medium leading-relaxed italic">
                  "{aiAnalysis}"
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="absolute bottom-6 left-6 z-10 flex flex-col items-start gap-2 pointer-events-none">
        <p className="text-[10px] text-slate-500 font-mono bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800 uppercase">
          MODO {isMapMode ? 'GEO-REFERENCIADO' : 'DYNAMICS'} • STATUS ACTIVE
        </p>
      </div>

      <div className="absolute top-6 right-6 z-10 flex gap-2 pointer-events-auto">

        <button
          onClick={() => {
            if (simulationRef.current) {
              simulationRef.current.alpha(1).restart();
            }
          }}
          className="bg-slate-900/90 hover:bg-slate-800 text-slate-300 p-2 rounded-xl border border-slate-700/50 transition-all active:scale-95 shadow-lg group pointer-events-auto"
          title="Re-layout Simulation"
        >
          <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TopologyMap;
