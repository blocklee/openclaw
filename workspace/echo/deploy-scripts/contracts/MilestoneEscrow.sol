// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract MilestoneEscrow is Ownable {
    struct Milestone {
        address creator;
        uint256 totalAmount;
        uint8 milestoneCount;
        uint8 releasedCount;
        mapping(uint8 => bool) released;
        bool emergencyRefunded;
    }

    event MilestoneLocked(bytes32 indexed projectId, uint256 amount, uint8 milestoneCount, uint256 timestamp);
    event MilestoneReleased(bytes32 indexed projectId, uint256 amount, uint8 milestone, uint256 timestamp);
    event EmergencyRefund(bytes32 indexed projectId, uint256 amount, uint256 timestamp);
    event PhaseTransition(bytes32 indexed nodeId, uint8 indexed phase, uint8 reasonCode, uint256 timestamp);

    mapping(bytes32 => Milestone) public milestones;
    mapping(bytes32 => bool) public projectExists;
    mapping(bytes32 => uint8) public milestonePhase;

    constructor(address initialOwner) Ownable(initialOwner) {}

    function lockMilestone(bytes32 projectId, uint256 amount, uint8 milestoneCount) external payable {
        require(msg.value == amount, "ETH amount mismatch");
        require(amount > 0, "Must send ETH");
        require(milestoneCount > 0, "Milestone count must be > 0");
        require(!projectExists[projectId], "Project already exists");

        Milestone storage ms = milestones[projectId];
        ms.creator = msg.sender;
        ms.totalAmount = msg.value;
        ms.milestoneCount = milestoneCount;
        ms.releasedCount = 0;
        ms.emergencyRefunded = false;
        projectExists[projectId] = true;

        emit MilestoneLocked(projectId, msg.value, milestoneCount, block.timestamp);
        emit PhaseTransition(projectId, 1, 1, block.timestamp); // 震/sunrise
    }

    function releaseMilestone(bytes32 projectId, uint8 milestone) external onlyOwnerOrCreator(projectId) {
        require(projectExists[projectId], "Project does not exist");
        require(!milestones[projectId].emergencyRefunded, "Already refunded");
        require(milestone < milestones[projectId].milestoneCount, "Invalid milestone");
        require(!milestones[projectId].released[milestone], "Milestone already released");

        Milestone storage ms = milestones[projectId];
        uint256 releaseAmount = ms.totalAmount / ms.milestoneCount;
        if (milestone == ms.milestoneCount - 1) {
            releaseAmount = ms.totalAmount - (releaseAmount * (ms.milestoneCount - 1));
        }
        ms.released[milestone] = true;
        ms.releasedCount++;

        (bool success, ) = payable(ms.creator).call{value: releaseAmount}("");
        require(success, "Transfer failed");

        emit MilestoneReleased(projectId, releaseAmount, milestone, block.timestamp);
        emit PhaseTransition(projectId, 2, 2, block.timestamp); // 流行
    }

    function emergencyRefund(bytes32 projectId) external onlyOwnerOrCreator(projectId) {
        require(projectExists[projectId], "Project does not exist");
        require(!milestones[projectId].emergencyRefunded, "Already refunded");

        Milestone storage ms = milestones[projectId];
        uint256 refundAmount = ms.totalAmount;
        uint256 alreadyReleased = (ms.totalAmount / ms.milestoneCount) * ms.releasedCount;
        if (alreadyReleased < refundAmount) refundAmount = refundAmount - alreadyReleased;
        else refundAmount = 0;

        require(refundAmount > 0, "Nothing to refund");
        ms.emergencyRefunded = true;

        (bool success, ) = payable(ms.creator).call{value: refundAmount}("");
        require(success, "Refund failed");

        emit EmergencyRefund(projectId, refundAmount, block.timestamp);
        emit PhaseTransition(projectId, 5, 5, block.timestamp); // 性命/sunset
    }

    function getMilestoneInfo(bytes32 projectId) external view returns (address creator, uint256 totalAmount, uint8 milestoneCount, uint8 releasedCount, bool emergencyRefunded) {
        require(projectExists[projectId], "Project does not exist");
        Milestone storage ms = milestones[projectId];
        return (ms.creator, ms.totalAmount, ms.milestoneCount, ms.releasedCount, ms.emergencyRefunded);
    }

    function isReleased(bytes32 projectId, uint8 milestone) external view returns (bool) {
        require(projectExists[projectId], "Project does not exist");
        return milestones[projectId].released[milestone];
    }

    function bindMilestonePhase(bytes32 projectId, uint8 phase) external onlyOwner {
        require(phase <= 5, "Invalid phase");
        milestonePhase[projectId] = phase;
    }

    function getMilestonePhase(bytes32 projectId) external view returns (uint8) {
        return milestonePhase[projectId];
    }

    modifier onlyOwnerOrCreator(bytes32 projectId) {
        require(msg.sender == owner() || (projectExists[projectId] && msg.sender == milestones[projectId].creator), "Not authorized");
        _;
    }

    receive() external payable {
        revert("Use lockMilestone() to deposit");
    }
}
