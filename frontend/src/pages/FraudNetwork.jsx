import { useState, useRef, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import axios from 'axios';
import API_BASE from '../lib/api';
import { Network, MousePointer2, ShieldAlert, Activity, AlertCircle } from 'lucide-react';

export default function FraudNetwork() {
  const baselineContainerRef = useRef(null);
  const liveContainerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 600 });
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedRelationship, setSelectedRelationship] = useState(null);
  const [activeCase, setActiveCase] = useState(1);
  
  // State for live data with animations
  const [liveData, setLiveData] = useState({ nodes: [], links: [] });
  const [animatingEdges, setAnimatingEdges] = useState(new Set());
  const [loadingLive, setLoadingLive] = useState(false);

  useEffect(() => {
    const updateDimensions = () => {
      if (baselineContainerRef.current && liveContainerRef.current) {
        const baselineWidth = baselineContainerRef.current.clientWidth;
        const liveWidth = liveContainerRef.current.clientWidth;
        const baselineHeight = baselineContainerRef.current.clientHeight;
        const liveHeight = liveContainerRef.current.clientHeight;
        
        // Use actual rendered dimensions
        const width = Math.max(baselineWidth, liveWidth, 400);
        const height = Math.max(baselineHeight, liveHeight, 500);
        
        setDimensions({ width, height });
      }
    };

    // Initial calculation
    updateDimensions();

    // Recalculate on window resize
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (baselineContainerRef.current) resizeObserver.observe(baselineContainerRef.current);
    if (liveContainerRef.current) resizeObserver.observe(liveContainerRef.current);

    return () => resizeObserver.disconnect();
  }, [activeCase]);

  // Fetch Live Neo4j Data and set up pulse animations
  useEffect(() => {
    setLoadingLive(true);
    axios.get(`${API_BASE}/live-graph`)
      .then(res => {
        const data = res.data;
        // Add animation property to edges
        const animatedLinks = data.links ? data.links.map((link, idx) => ({
          ...link,
          animatedIn: idx % 3 === 0 // Stagger animations
        })) : [];
        
        setLiveData({ nodes: data.nodes || [], links: animatedLinks });
        
        // Simulate pulse animations on edges
        if (animatedLinks.length > 0) {
          const animatingSet = new Set();
          animatedLinks.forEach((link, idx) => {
            setTimeout(() => {
              animatingSet.add(idx);
              setAnimatingEdges(new Set(animatingSet));
              
              setTimeout(() => {
                animatingSet.delete(idx);
                setAnimatingEdges(new Set(animatingSet));
              }, 1000);
            }, idx * 500);
          });
        }
        
        setLoadingLive(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingLive(false);
      });
  }, [activeCase]);

  const caseStudies = {
    1: {
      title: "Case Study 1: Agent Reversal Scam Ring",
      description: "Demonstrates a directed cycle followed by a fan-in pattern.",
      data: {
        nodes: [
          { id: 'SCAMMER_1', group: 'scammer', name: 'Mastermind', val: 20 },
          { id: 'MULE_A', group: 'mule', name: 'Layering Mule A', val: 15 },
          { id: 'MULE_B', group: 'mule', name: 'Layering Mule B', val: 15 },
          { id: 'MULE_C', group: 'mule', name: 'Layering Mule C', val: 15 },
          { id: 'AGENT_99', group: 'agent', name: 'Target Reversal Agent', val: 25 },
        ],
        links: [
          { source: 'SCAMMER_1', target: 'MULE_A', risk: 'high' },
          { source: 'MULE_A', target: 'MULE_B', risk: 'high' },
          { source: 'MULE_B', target: 'MULE_C', risk: 'medium' },
          { source: 'MULE_C', target: 'SCAMMER_1', risk: 'high' }, 
          { source: 'MULE_A', target: 'AGENT_99', risk: 'high' },  
          { source: 'MULE_B', target: 'AGENT_99', risk: 'high' },  
          { source: 'MULE_C', target: 'AGENT_99', risk: 'high' },  
        ]
      }
    },
    2: {
      title: "Case Study 2: Mulot SIM Swap Mules",
      description: "Demonstrates star-shaped subgraphs utilizing stolen national IDs.",
      data: {
        nodes: [
          { id: 'MULOT_ORG', group: 'scammer', name: 'Central Syndicate', val: 30 },
          { id: 'MULE_1', group: 'mule', name: 'Stolen ID 1', val: 10 },
          { id: 'MULE_2', group: 'mule', name: 'Stolen ID 2', val: 10 },
          { id: 'MULE_3', group: 'mule', name: 'Stolen ID 3', val: 10 },
          { id: 'MULE_4', group: 'mule', name: 'Stolen ID 4', val: 10 },
          { id: 'MULE_5', group: 'mule', name: 'Stolen ID 5', val: 10 },
        ],
        links: [
          { source: 'MULOT_ORG', target: 'MULE_1', risk: 'high' },
          { source: 'MULOT_ORG', target: 'MULE_2', risk: 'high' },
          { source: 'MULOT_ORG', target: 'MULE_3', risk: 'high' },
          { source: 'MULOT_ORG', target: 'MULE_4', risk: 'high' },
          { source: 'MULOT_ORG', target: 'MULE_5', risk: 'high' },
        ]
      }
    },
    3: {
      title: "Case Study 3: Identity to Fast Cash-out Explosion",
      description: "Demonstrates an explosive star topology of consecutive transactions.",
      data: {
        nodes: [
          { id: 'HIJACKED_ACC', group: 'victim', name: 'Compromised User', val: 25 },
          { id: 'DROP_1', group: 'mule', name: 'Drop Account 1', val: 10 },
          { id: 'DROP_2', group: 'mule', name: 'Drop Account 2', val: 10 },
          { id: 'DROP_3', group: 'mule', name: 'Drop Account 3', val: 10 },
          { id: 'AGENT_X', group: 'agent', name: 'Cash Out Agent', val: 20 },
        ],
        links: [
          { source: 'HIJACKED_ACC', target: 'DROP_1', risk: 'high' },
          { source: 'HIJACKED_ACC', target: 'DROP_2', risk: 'high' },
          { source: 'HIJACKED_ACC', target: 'DROP_3', risk: 'high' },
          { source: 'DROP_1', target: 'AGENT_X', risk: 'high' }, 
          { source: 'DROP_2', target: 'AGENT_X', risk: 'high' }, 
          { source: 'DROP_3', target: 'AGENT_X', risk: 'high' }, 
        ]
      }
    },
    4: {
      title: "Case Study 4: Synecdoche Circles (Fuliza/M-Shwari)",
      description: "Demonstrates homophily. Synthetic identities collaborate to artificially boost credit limits.",
      data: {
        nodes: [
          { id: 'LENDER_API', group: 'till', name: 'Fuliza/M-Shwari API', val: 30 },
          { id: 'SYN_1', group: 'mule', name: 'Synthetic ID 1', val: 15 },
          { id: 'SYN_2', group: 'mule', name: 'Synthetic ID 2', val: 15 },
          { id: 'SYN_3', group: 'mule', name: 'Synthetic ID 3', val: 15 },
          { id: 'SYN_4', group: 'mule', name: 'Synthetic ID 4', val: 15 },
        ],
        links: [
          { source: 'SYN_1', target: 'SYN_2', risk: 'medium' },
          { source: 'SYN_2', target: 'SYN_3', risk: 'medium' },
          { source: 'SYN_3', target: 'SYN_1', risk: 'medium' },
          { source: 'SYN_4', target: 'SYN_1', risk: 'medium' },
          { source: 'SYN_4', target: 'SYN_2', risk: 'medium' },
          { source: 'LENDER_API', target: 'SYN_1', risk: 'high' },
          { source: 'LENDER_API', target: 'SYN_2', risk: 'high' },
          { source: 'LENDER_API', target: 'SYN_3', risk: 'high' },
          { source: 'LENDER_API', target: 'SYN_4', risk: 'high' },
        ]
      }
    },
    5: {
      title: "Case Study 5: Fraudulent Business Till Inflation",
      description: "Demonstrates unusual densification of an account-pair to launder money.",
      data: {
        nodes: [
          { id: 'BIZ_TILL', group: 'till', name: 'Business Till', val: 35 },
          { id: 'LAUNDER_1', group: 'scammer', name: 'Wash Account 1', val: 20 },
          { id: 'LAUNDER_2', group: 'scammer', name: 'Wash Account 2', val: 20 },
          { id: 'NORMAL_USER', group: 'victim', name: 'Legitimate Customer', val: 10 },
        ],
        links: [
          { source: 'LAUNDER_1', target: 'BIZ_TILL', risk: 'high' },
          { source: 'BIZ_TILL', target: 'LAUNDER_1', risk: 'high' },
          { source: 'LAUNDER_2', target: 'BIZ_TILL', risk: 'high' },
          { source: 'BIZ_TILL', target: 'LAUNDER_2', risk: 'high' },
          { source: 'NORMAL_USER', target: 'BIZ_TILL', risk: 'low' },
        ]
      }
    },
    'LIVE': {
      title: "Live Production Graph (Neo4j)",
      description: "Real-time topology of transactions directly mapped from the Neo4j database.",
      data: liveData
    }
  };

  const currentGraph = caseStudies[activeCase];

  const drawNode = (node, ctx, globalScale) => {
    const label = node.id;
    const fontSize = 12 / globalScale;
    ctx.font = `${fontSize}px Sans-Serif`;
    
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.val / 2, 0, 2 * Math.PI, false);
    ctx.fillStyle = 
      node.group === 'scammer' ? '#ef4444' : 
      node.group === 'mule' ? '#f59e0b' :    
      node.group === 'agent' ? '#8b5cf6' :   
      node.group === 'till' ? '#10b981' :    
      node.group === 'victim' ? '#06b6d4' :
      '#3b82f6';                             
    ctx.fill();
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1f2937';
    ctx.fillText(label, node.x, node.y + (node.val / 2) + 6);
  };

  const getLinkColor = (link, isAnimating = false) => {
    if (isAnimating) return '#ff6b6b'; // Bright red for animating edges
    if (link.risk === 'high') return '#ef4444'; 
    if (link.risk === 'medium') return '#f59e0b'; 
    return '#9ca3af'; 
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header with Case Selector */}
      <div className="px-6 pt-6 pb-4 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Network className="text-brandPrimary" size={32} />
              Fraud Network Visualization
            </h1>
            <p className="text-gray-500 text-sm mt-1">Baseline vs Live Activity Analysis</p>
          </div>
          
          <div className="flex gap-2 flex-wrap justify-end">
            {[1, 2, 3, 4, 5].map(num => (
              <button 
                key={num}
                onClick={() => { setSelectedNode(null); setSelectedRelationship(null); setActiveCase(num); }}
                className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors whitespace-nowrap ${
                  activeCase === num ? 'bg-brandPrimary text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                Case {num}
              </button>
            ))}
          </div>
        </div>

        {/* Case Description */}
        <div className={`border p-4 rounded-lg flex items-start gap-3 ${
          liveData.nodes.length > 0 ? 'bg-blue-50 border-blue-200' : 'bg-indigo-50 border-indigo-100'
        }`}>
          <ShieldAlert className={`${liveData.nodes.length > 0 ? 'text-blue-600' : 'text-brandPrimary'} shrink-0 mt-0.5`} size={20} />
          <div>
            <h3 className="font-bold text-gray-900 text-sm">{caseStudies[activeCase].title}</h3>
            <p className="text-sm text-gray-700 mt-1">{caseStudies[activeCase].description}</p>
          </div>
        </div>
      </div>

      {/* Split View: Baseline & Live Graphs - Full Height */}
      <div className="flex-1 flex gap-4 p-6 overflow-hidden">
        
        {/* LEFT: Baseline Graph (Static) */}
        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-bold text-gray-800 text-sm">BASELINE</h3>
            <span className="text-xs text-gray-500">Theoretical Pattern</span>
          </div>
          <div 
            ref={baselineContainerRef} 
            className="flex-1 cursor-grab active:cursor-grabbing overflow-hidden bg-gray-50 relative"
          >
            {dimensions.width > 50 && caseStudies[activeCase].data.nodes.length > 0 && (
              <ForceGraph2D
                width={dimensions.width}
                height={dimensions.height}
                graphData={caseStudies[activeCase].data}
                nodeCanvasObject={drawNode}
                linkColor={(link) => getLinkColor(link, false)}
                linkDirectionalArrowLength={3.5}
                linkDirectionalArrowRelPos={1}
                linkWidth={link => link.risk === 'high' ? 2 : 1}
                onNodeClick={node => {
                  setSelectedNode(node);
                  setSelectedRelationship(null);
                }}
                onLinkClick={(link) => {
                  setSelectedRelationship(link);
                  setSelectedNode(null);
                }}
                cooldownTicks={100}
              />
            )}
          </div>
        </div>

        {/* RIGHT: Live Activity Graph (Animated) */}
        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-800 text-sm">LIVE ACTIVITY</h3>
              {liveData.nodes.length > 0 && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
            </div>
            <span className="text-xs text-gray-500">{liveData.nodes.length} nodes | {liveData.links.length} edges</span>
          </div>
          <div 
            ref={liveContainerRef} 
            className="flex-1 cursor-grab active:cursor-grabbing overflow-hidden bg-green-50 relative"
          >
            {loadingLive && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                <p className="font-bold text-green-600 animate-pulse">Pulling live transactions...</p>
              </div>
            )}
            {dimensions.width > 50 && liveData.nodes.length > 0 && (
              <ForceGraph2D
                width={dimensions.width}
                height={dimensions.height}
                graphData={liveData}
                nodeCanvasObject={drawNode}
                linkColor={(link, idx) => {
                  const isAnimating = animatingEdges.has(liveData.links.indexOf(link));
                  return getLinkColor(link, isAnimating);
                }}
                linkDirectionalArrowLength={3.5}
                linkDirectionalArrowRelPos={1}
                linkWidth={(link) => {
                  const isAnimating = animatingEdges.has(liveData.links.indexOf(link));
                  return isAnimating ? 4 : (link.risk === 'high' ? 2 : 1);
                }}
                onNodeClick={node => {
                  setSelectedNode(node);
                  setSelectedRelationship(null);
                }}
                onLinkClick={(link) => {
                  setSelectedRelationship(link);
                  setSelectedNode(null);
                }}
                cooldownTicks={100}
              />
            )}
            {liveData.nodes.length === 0 && !loadingLive && (
              <div className="absolute inset-0 flex items-center justify-center">
                <AlertCircle size={40} className="text-gray-300 mb-3" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selected Node/Relationship Info Bar - Bottom */}
      {(selectedNode || selectedRelationship) && (
        <div className="px-6 py-4 bg-blue-50 border-t border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <MousePointer2 size={16} className="text-brandPrimary" />
                {selectedNode ? `Node: ${selectedNode.id}` : selectedRelationship ? `Edge: ${selectedRelationship.source} → ${selectedRelationship.target}` : 'Selection'}
              </p>
            </div>
            {selectedNode && (
              <span className="px-3 py-1 bg-indigo-100 rounded-full text-xs font-bold text-brandPrimary capitalize">
                {selectedNode.group.replace('_', ' ')}
              </span>
            )}
            {selectedRelationship && (
              <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                selectedRelationship.risk === 'high' ? 'bg-red-100 text-red-700' :
                selectedRelationship.risk === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-green-100 text-green-700'
              }`}>
                Risk: {selectedRelationship.risk}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}