// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * SecureVault Smart Contract
 * Manages file permissions on Polygon Mumbai testnet
 */
contract SecureVault {
    // File structure
    struct File {
        address owner;
        string storagePath;
        bool exists;
        mapping(address => bool) hasAccess;
    }

    // Mappings
    mapping(string => File) private files;
    mapping(address => string[]) private userFiles;
    mapping(address => bool) private lockedDown;

    // Events
    event FileRegistered(string indexed fileId, address indexed owner, string storagePath);
    event AccessGranted(string indexed fileId, address indexed recipient, address indexed grantedBy);
    event AccessRevoked(string indexed fileId, address indexed recipient);
    event LockdownExecuted(address indexed user, uint256 timestamp);

    // Modifiers
    modifier onlyFileOwner(string memory fileId) {
        require(files[fileId].exists, "File does not exist");
        require(files[fileId].owner == msg.sender, "Not file owner");
        _;
    }

    modifier notLockedDown() {
        require(!lockedDown[msg.sender], "Account is locked down");
        _;
    }

    /**
     * Register a new file
     * @param fileId Unique file identifier
     * @param owner File owner address
     * @param storagePath Storage path (Supabase Storage path)
     */
    function registerFile(
        string memory fileId,
        address owner,
        string memory storagePath
    ) external notLockedDown {
        require(!files[fileId].exists, "File already registered");
        require(owner == msg.sender, "Owner must be sender");

        File storage newFile = files[fileId];
        newFile.owner = owner;
        newFile.storagePath = storagePath;
        newFile.exists = true;
        newFile.hasAccess[owner] = true; // Owner always has access

        userFiles[owner].push(fileId);

        emit FileRegistered(fileId, owner, storagePath);
    }

    /**
     * Grant access to a file
     * @param fileId File identifier
     * @param recipient Address to grant access to
     */
    function grantAccess(string memory fileId, address recipient)
        external
        onlyFileOwner(fileId)
        notLockedDown
    {
        require(recipient != address(0), "Invalid recipient");
        require(!files[fileId].hasAccess[recipient], "Already has access");

        files[fileId].hasAccess[recipient] = true;

        emit AccessGranted(fileId, recipient, msg.sender);
    }

    /**
     * Revoke access to a file
     * @param fileId File identifier
     * @param recipient Address to revoke access from
     */
    function revokeAccess(string memory fileId, address recipient)
        external
        onlyFileOwner(fileId)
    {
        require(recipient != files[fileId].owner, "Cannot revoke owner access");
        require(files[fileId].hasAccess[recipient], "No access to revoke");

        files[fileId].hasAccess[recipient] = false;

        emit AccessRevoked(fileId, recipient);
    }

    /**
     * Emergency lockdown - revoke all permissions
     * This is irreversible and prevents future grants
     */
    function revokeAllAccess() external {
        require(!lockedDown[msg.sender], "Already locked down");

        lockedDown[msg.sender] = true;

        // Note: In a production contract, you'd iterate through all permissions
        // For this MVP, we're marking the account as locked down
        // The frontend will handle revoking individual permissions

        emit LockdownExecuted(msg.sender, block.timestamp);
    }

    /**
     * Check if an address has access to a file
     * @param fileId File identifier
     * @param user Address to check
     * @return bool True if user has access
     */
    function hasAccess(string memory fileId, address user)
        external
        view
        returns (bool)
    {
        if (!files[fileId].exists) return false;
        return files[fileId].hasAccess[user];
    }

    /**
     * Get file owner
     * @param fileId File identifier
     * @return address Owner address
     */
    function getFileOwner(string memory fileId)
        external
        view
        returns (address)
    {
        require(files[fileId].exists, "File does not exist");
        return files[fileId].owner;
    }

    /**
     * Check if account is locked down
     * @param user Address to check
     * @return bool True if locked down
     */
    function isLockedDown(address user) external view returns (bool) {
        return lockedDown[user];
    }

    /**
     * Get user's file count
     * @param user Address to check
     * @return uint256 Number of files
     */
    function getUserFileCount(address user) external view returns (uint256) {
        return userFiles[user].length;
    }
}
