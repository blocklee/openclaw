// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CreatorConfig.sol";
import "./EdgeDeclaration.sol";

contract DeadlockInspector {
    event AssemblyApproved(bytes32 indexed assemblyId, string reason);
    event AssemblyRejected(bytes32 indexed assemblyId, string reason);

    CreatorConfig public creatorConfig;
    EdgeDeclaration public edgeDeclaration;

    constructor(address _cc, address _ed) {
        creatorConfig = CreatorConfig(_cc);
        edgeDeclaration = EdgeDeclaration(_ed);
    }

    function checkModuleComposability(bytes32 nodeId) external view returns (bool) {
        if (!creatorConfig.exists(nodeId)) return false;
        (,, uint8[4] memory r) = creatorConfig.getNode(nodeId);
        return r[2] > 0;
    }

    function checkAssemblyDeadlock(bytes32[] calldata nodeIds) external view returns (bool ok, string memory reason) {
        if (nodeIds.length < 2) return (false, "Need 2+ nodes");
        for (uint i; i < nodeIds.length; i++) {
            if (!creatorConfig.exists(nodeIds[i])) return (false, "Node missing");
            (,, uint8[4] memory r) = creatorConfig.getNode(nodeIds[i]);
            if (r[2] == 0) return (false, "Not composable");
        }
        for (uint i; i < nodeIds.length; i++) {
            EdgeDeclaration.Edge[] memory out = edgeDeclaration.getEdges(nodeIds[i]);
            for (uint j; j < out.length; j++) {
                bool inA;
                for (uint k; k < nodeIds.length; k++) if (nodeIds[k] == out[j].toNode) { inA = true; break; }
                if (inA && edgeDeclaration.hasEdge(out[j].toNode, nodeIds[i])) return (false, "Circular");
            }
        }
        return (true, "");
    }

    function generateAssemblyId(bytes32[] calldata nodeIds) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(nodeIds));
    }

    function approveAssembly(bytes32[] calldata nodeIds) external {
        (bool ok, string memory reason) = this.checkAssemblyDeadlock(nodeIds);
        bytes32 id = this.generateAssemblyId(nodeIds);
        if (ok) emit AssemblyApproved(id, reason);
        else emit AssemblyRejected(id, reason);
    }
}
