// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CreatorConfig.sol";

contract EdgeDeclaration {
    struct Edge { bytes32 toNode; address declarer; uint256 depth; uint256 timestamp; }

    event EdgeDeclared(bytes32 indexed fromNode, bytes32 indexed toNode, address indexed declarer, uint256 depth, uint256 timestamp);

    CreatorConfig public creatorConfig;
    mapping(bytes32 => Edge[]) public edges;
    mapping(bytes32 => mapping(bytes32 => bool)) public edgeExists;

    constructor(address _creatorConfig) { creatorConfig = CreatorConfig(_creatorConfig); }

    function declareEdge(bytes32 fromNode, bytes32 toNode, uint256 depth) external {
        require(creatorConfig.exists(fromNode));
        require(creatorConfig.exists(toNode));
        require(fromNode != toNode);
        require(!edgeExists[fromNode][toNode]);

        edges[fromNode].push(Edge(toNode, msg.sender, depth, block.timestamp));
        edgeExists[fromNode][toNode] = true;
        emit EdgeDeclared(fromNode, toNode, msg.sender, depth, block.timestamp);
    }

    function getEdges(bytes32 fromNode) external view returns (Edge[] memory) { return edges[fromNode]; }
    function getEdgeCount(bytes32 fromNode) external view returns (uint256) { return edges[fromNode].length; }
    function hasEdge(bytes32 fromNode, bytes32 toNode) external view returns (bool) { return edgeExists[fromNode][toNode]; }
}
