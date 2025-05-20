// state.js - Game state management
export function createGameState() {
    return {
        // Game configuration
        config: {
            // Region settings
            maxRegionValue: 100,
            regionsPerRow: 10,
            unitPerClick: 1,
            
            // Conversion and decay settings
            decayDelayAfterClick: 3000, // ms
            baseDecayRate: 0.2,
            minDecayMultiplier: 0.3,
            intellectualBonus: 0.3,
            
            // Resource settings
            resourceRateAt100: 1.0, // Resource per second when region is at 100 value
            adjacencyBonus: 1.0, // 100% bonus for each adjacent converted region
            
            // Item costs
            thoughtCostForIntellectual: 20
        },
        
        // Game state
        regions: generateInitialRegions(),
        resources: {
            thought: 0,
            guns: 0,
            volunteers: 0
        },
        draggingItem: null,
        intellectuals: [],
        nextIntellectualId: 1,
        lastResourceUpdate: Date.now(),
        totalConversionPercentage: 0
    };
}

// Generate initial regions with organized city layout
function generateInitialRegions() {
    const regions = [];
    const gridSize = 10; // 10x5 grid for a total of 50 regions
    
    // Create 50 regions with city layout
    for (let i = 0; i < 50; i++) {
        // Determine region type based on position in the grid
        // 10 academic (top left), 10 military (top right), 30 residential (bottom)
        let type;
        if (i < 10) {
            type = 'academic'; // First 10 regions
        } else if (i < 20) {
            type = 'military'; // Next 10 regions
        } else {
            type = 'residential'; // Remaining 30 regions
        }
        
        regions.push({
            id: i + 1,
            type: type,
            currentValue: 0,
            intellectuals: 0,
            lastClicked: Date.now(), // Add this to prevent immediate decay
            lastUpdated: Date.now(),
            conversionRate: -0.2, // Natural decay/conversion rate
            productionRatePerSecond: 0,
            producedResourceType: type === 'academic' ? 'thought' : 
                                 type === 'military' ? 'guns' : 'volunteers'
        });
    }
    
    return regions;
}

// Find region by ID
export function findRegionById(gameState, regionId) {
    return gameState.regions.find(region => region.id === regionId);
}

// Add value to a region
export function addValueToRegion(region, amount, gameState) {
    const maxValue = gameState.config.maxRegionValue;
    region.currentValue = Math.min(maxValue, region.currentValue + amount);
    region.lastClicked = Date.now(); // Update last clicked time
    return region.currentValue;
}

// Create a new intellectual
export function createIntellectual(gameState, x, y) {
    const intellectual = {
        id: gameState.nextIntellectualId++,
        type: 'intellectual',
        x: x,
        y: y,
        assignedRegion: null
    };
    
    gameState.intellectuals.push(intellectual);
    return intellectual;
}

// Assign intellectual to a region
export function assignIntellectualToRegion(gameState, intellectualId, regionId) {
    const intellectual = gameState.intellectuals.find(i => i.id === intellectualId);
    const region = findRegionById(gameState, regionId);
    
    if (intellectual && region) {
        intellectual.assignedRegion = regionId;
        region.intellectuals += 1;
        return true;
    }
    
    return false;
}

// Get intellectuals assigned to a region
export function getIntellectualsInRegion(gameState, regionId) {
    return gameState.intellectuals.filter(i => i.assignedRegion === regionId);
}

// Spend resources
export function spendResource(gameState, resourceType, amount) {
    if (gameState.resources[resourceType] >= amount) {
        gameState.resources[resourceType] -= amount;
        return true;
    }
    return false;
}
