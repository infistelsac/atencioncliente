import React, { useState, useEffect, useRef } from 'react';
import { NetworkDevice } from '../../types/monitoring';

interface DeviceTerminalProps {
    device: NetworkDevice;
    onClose: () => void;
}

interface TerminalLine {
    type: 'input' | 'output' | 'system';
    content: string;
}

const DeviceTerminal: React.FC<DeviceTerminalProps> = ({ device, onClose }) => {
    const [lines, setLines] = useState<TerminalLine[]>([]);
    const [input, setInput] = useState('');
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Initial connection simulation
        setLines([
            { type: 'system', content: `Connecting to ${device.ip || '192.168.88.1'}...` }
        ]);

        const timer = setTimeout(() => {
            setLines(prev => [
                ...prev,
                { type: 'system', content: 'Connection established.' },
                { type: 'system', content: `Welcome to ${device.name} (${device.model})` },
                { type: 'system', content: 'Type "help" for available commands.' }
            ]);
        }, 800);

        return () => clearTimeout(timer);
    }, [device]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [lines]);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const executeCommand = (cmd: string) => {
        const args = cmd.trim().split(' ');
        const command = args[0].toLowerCase();

        let output: string | string[] = '';

        switch (command) {
            case 'help':
                output = [
                    'Available commands:',
                    '  ping <address>       - Send ICMP echo requests',
                    '  interface print      - Show interface status',
                    '  ip address print     - Show IP configuration',
                    '  system resource print - Show system resources',
                    '  clear                - Clear terminal screen',
                    '  exit                 - Close terminal session'
                ].join('\n');
                break;

            case 'clear':
                setLines([]);
                return;

            case 'exit':
                onClose();
                return;

            case 'ping':
                if (!args[1]) {
                    output = 'invalid value for argument address';
                } else {
                    output = `  SEQ HOST                                     SIZE TTL TIME  STATUS\n    0 ${args[1]}                                   56  64 2ms   echo reply\n    1 ${args[1]}                                   56  64 3ms   echo reply\n    2 ${args[1]}                                   56  64 2ms   echo reply\n    sent=3 received=3 packet-loss=0% min-rtt=2ms avg-rtt=2ms max-rtt=3ms`;
                }
                break;

            case 'interface':
                if (args[1] === 'print') {
                    output = [
                        'Flags: X - disabled, R - running, S - slave',
                        ' #    NAME                       TYPE       ACTUAL-MTU L2MTU  MAX-L2MTU',
                        ' 0  R ether1                     ether            1500  1598       9578',
                        ' 1  R ether2                     ether            1500  1598       9578',
                        ' 2    ether3                     ether            1500  1598       9578',
                        ' 3  R sfp-sfpplus1               ether            1500  1598       9578'
                    ].join('\n');
                } else {
                    output = 'bad command name interface (line 1 column 1)';
                }
                break;

            case 'ip':
                if (args[1] === 'address' && args[2] === 'print') {
                    output = [
                        'Flags: X - disabled, I - invalid, D - dynamic',
                        ' #   ADDRESS            NETWORK         INTERFACE',
                        ` 0   ${device.ip}/24       ${device.ip?.split('.').slice(0, 3).join('.')}.0    ether1`,
                        ' 1 D 192.168.1.1/24     192.168.1.0     ether2'
                    ].join('\n');
                } else {
                    output = 'bad command name ip (line 1 column 1)';
                }
                break;

            case 'system':
                if (args[1] === 'resource' && args[2] === 'print') {
                    output = [
                        `            uptime: ${device.uptime || '1d 04:20:33'}`,
                        '           version: 7.12.1 (stable)',
                        '        build-time: Nov/12/2023 14:10:00',
                        '       factory-software: 6.48.6',
                        '           free-memory: 3845.2MiB',
                        '          total-memory: 4096.0MiB',
                        '               cpu: ARM64',
                        '         cpu-count: 4',
                        '     cpu-frequency: 1400MHz',
                        '          cpu-load: 3%',
                        '    free-hdd-space: 1024.5MiB',
                        '   total-hdd-space: 2048.0MiB',
                        '  write-sect-since-reboot: 1425',
                        '         write-sect-total: 45214',
                        '        bad-blocks: 0%',
                        '        architecture-name: arm64',
                        '               board-name: CCR2004-16G-2S+',
                        '         platform: MikroTik'
                    ].join('\n');
                } else {
                    output = 'bad command name system (line 1 column 1)';
                }
                break;

            case '':
                break;

            default:
                output = `bad command name ${command} (line 1 column 1)`;
        }

        if (output) {
            setLines(prev => [
                ...prev,
                { type: 'input', content: cmd },
                { type: 'output', content: output as string }
            ]);
        } else if (cmd) {
            setLines(prev => [...prev, { type: 'input', content: cmd }]);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            executeCommand(input);
            setHistory(prev => [...prev, input]);
            setHistoryIndex(-1);
            setInput('');
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (history.length > 0) {
                const newIndex = historyIndex + 1;
                if (newIndex < history.length) {
                    setHistoryIndex(newIndex);
                    setInput(history[history.length - 1 - newIndex]);
                }
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex > 0) {
                const newIndex = historyIndex - 1;
                setHistoryIndex(newIndex);
                setInput(history[history.length - 1 - newIndex]);
            } else if (historyIndex === 0) {
                setHistoryIndex(-1);
                setInput('');
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-black w-full max-w-4xl h-[600px] rounded-xl shadow-2xl overflow-hidden border border-slate-700 flex flex-col font-mono text-sm animate-in zoom-in-95 duration-200">
                {/* Title Bar */}
                <div className="bg-slate-900 border-b border-slate-800 p-2 px-4 flex justify-between items-center select-none">
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-rose-500/20 border border-rose-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50"></div>
                        </div>
                        <span className="text-slate-400 text-xs font-bold ml-2">admin@{device.ip || 'device'} - Terminal</span>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path></svg>
                    </button>
                </div>

                {/* Terminal Content */}
                <div
                    className="flex-1 p-4 overflow-y-auto custom-scrollbar"
                    onClick={() => inputRef.current?.focus()}
                >
                    <div className="space-y-1">
                        {lines.map((line, i) => (
                            <div key={i} className={`${line.type === 'input' ? 'mt-2 mb-1' : ''} ${line.type === 'system' ? 'text-slate-500 italic' : line.type === 'error' ? 'text-rose-500' : 'text-slate-200'}`}>
                                {line.type === 'input' && <span className="text-emerald-500 mr-2">[admin@{device.name.replace(/\s+/g, '_')}] &gt;</span>}
                                <span className="whitespace-pre-wrap">{line.content}</span>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center mt-2">
                        <span className="text-emerald-500 mr-2">[admin@{device.name.replace(/\s+/g, '_')}] &gt;</span>
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="flex-1 bg-transparent outline-none text-slate-200 border-none p-0 focus:ring-0"
                            autoComplete="off"
                            spellCheck="false"
                        />
                        <div className="w-2 h-4 bg-slate-200 animate-pulse ml-0.5"></div>
                    </div>
                    <div ref={bottomRef}></div>
                </div>
            </div>
        </div>
    );
};

export default DeviceTerminal;
