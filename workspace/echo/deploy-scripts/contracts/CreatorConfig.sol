// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract CreatorConfig is Ownable {
    struct Node { address creator; uint256 timestamp; uint8[4] rights; }

    event NodeCreated(bytes32 indexed nodeId, address indexed creator, uint256 timestamp, uint8 usageRight, uint8 deriveRight, uint8 expandRight, uint8 benefitRight);
    event QuadrantSet(bytes32 indexed nodeId, uint8 usageRight, uint8 deriveRight, uint8 expandRight, uint8 benefitRight);

    mapping(bytes32 => Node) public nodes;
    mapping(bytes32 => bool) public nodeExists;

    modifier onlyNodeCreator(bytes32 nodeId) { require(nodeExists[nodeId]); require(nodes[nodeId].creator == msg.sender); _; }

    constructor(address initialOwner) Ownable(initialOwner) {}

    function createNode(bytes32 nodeId, uint8[4] calldata rights) external {
        require(!nodeExists[nodeId]);
        nodes[nodeId] = Node(msg.sender, block.timestamp, rights);
        nodeExists[nodeId] = true;
        emit NodeCreated(nodeId, msg.sender, block.timestamp, rights[0], rights[1], rights[2], rights[3]);
    }

    function updateQuadrant(bytes32 nodeId, uint8[4] calldata rights) external onlyNodeCreator(nodeId) {
        nodes[nodeId].rights = rights;
        emit QuadrantSet(nodeId, rights[0], rights[1], rights[2], rights[3]);
    }

    function getNode(bytes32 nodeId) external view returns (address, uint256, uint8[4] memory) {
        require(nodeExists[nodeId]);
        Node memory n = nodes[nodeId];
        return (n.creator, n.timestamp, n.rights);
    }

    function exists(bytes32 nodeId) external view returns (bool) {
        return nodeExists[nodeId];
    }
}
