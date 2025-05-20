// mechanics.js - Game mechanics and calculations

// Update region values (based on conversion rate)
export function updateRegionValues(gameState, deltaTime) {
    const now = Date.now();
    const config = gameState.config;
    const DECAY_DELAY_MS = config.decayDelayAfterClick;
    const MAX_VALUE = config.maxRegionValue;
    
    gameState.regions.forEach(region => {
        // Skip decay if at maximum value
        if (region.currentValue >= MAX_VALUE) {
            region.conversionRate = 0;
            return;
        }
        
        // Skip decay if clicked within the delay period
        const timeSinceLastClick = now - region.lastClicked;
        if (timeSinceLastClick < DECAY_DELAY_MS) {
            // Store 0 as conversion rate for display, but don't apply decay
            region.conversionRate = 0;
            return;
        }
        
        // Base conversion rate starts negative
        let conversionRate = -config.baseDecayRate;
        
        // Slow down decay based on current value
        // At 10 units: decay at full rate
        // At MAX_VALUE units: decay at minimum rate
        if (region.currentValue > 10) {
            const decayMultiplier = 1 - ((region.currentValue - 10) / (MAX_VALUE - 10));
            const minMultiplier = config.minDecayMultiplier;
            conversionRate *= Math.max(minMultiplier, decayMultiplier);
        }
        
        // Intellectuals add bonus to conversion rate
        if (region.intellectuals > 0) {
            conversionRate += region.intellectuals * config.intellectualBonus;
        }
        
        // Store the conversion rate for display
        region.conversionRate = conversionRate;
        
        // Calculate actual change for this time step
        const valueChange = conversionRate * deltaTime;
        
        // Apply change (capped between 0-MAX_VALUE)
        region.currentValue = Math.max(0, Math.min(MAX_VALUE, region.currentValue + valueChange));
    });
    
    // Calculate total conversion percentage
    calculateTotalConversion(gameState);
}

// Produce resources based on region values
export function produceResources(gameState, deltaTime) {
    const config = gameState.config;
    const MAX_VALUE = config.maxRegionValue;
    const resourceRateAt100 = config.resourceRateAt100;
    
    gameState.regions.forEach(region => {
        // Get resource type based on region type
        const resourceType = getResourceTypeFromRegion(region.type);
        
        // Calculate production rate (only for regions with positive values)
        // Linear scaling based on config.resourceRateAt100
        let productionRatePerSecond = 0;
        
        if (region.currentValue >= 10) {
            productionRatePerSecond = (region.currentValue / MAX_VALUE) * resourceRateAt100;
        }
        
        // Store the production rate for display
        region.productionRatePerSecond = productionRatePerSecond;
        region.producedResourceType = resourceType;
        
        // Calculate production for this time step
        const production = productionRatePerSecond * deltaTime;
        
        // Add resources
        gameState.resources[resourceType] += production;
    });
}

// Calculate total conversion percentage
export function calculateTotalConversion(gameState) {
    const totalRegions = gameState.regions.length;
    const maxPossibleValue = totalRegions * gameState.config.maxRegionValue;
    let currentTotalValue = 0;
    
    // Sum up current values of all regions
    gameState.regions.forEach(region => {
        currentTotalValue += region.currentValue;
    });
    
    // Calculate percentage (0-100)
    const conversionPercentage = (currentTotalValue / maxPossibleValue) * 100;
    
    // Store in game state
    gameState.totalConversionPercentage = conversionPercentage;
}

// Get resource type based on region type
function getResourceTypeFromRegion(regionType) {
    switch (regionType) {
        case 'academic': return 'thought';
        case 'military': return 'guns';
        case 'residential': return 'volunteers';
        default: return 'thought';
    }
}

// Get display level based on region value
export function getDisplayLevel(value) {
    if (value >= 150) return 'high';
    if (value >= 70) return 'medium';
    return 'low';
}

// Check if enough resources to purchase item
export function canPurchaseItem(gameState, itemType) {
    switch (itemType) {
        case 'intellectual':
            return gameState.resources.thought >= gameState.config.thoughtCostForIntellectual;
        // Add more items here as needed
        default:
            return false;
    }
}

// Create a new item (currently only intellectuals)
export function createItem(gameState, itemType, x, y) {
    switch (itemType) {
        case 'intellectual':
            if (spendResource(gameState, 'thought', gameState.config.thoughtCostForIntellectual)) {
                return createIntellectual(gameState, x, y);
            }
            break;
        // Add more items here as needed
        default:
            return null;
    }
    return null;
}

// Spend resources
function spendResource(gameState, resourceType, amount) {
    if (gameState.resources[resourceType] >= amount) {
        gameState.resources[resourceType] -= amount;
        return true;
    }
    return false;
}

// Create a new intellectual
function createIntellectual(gameState, x, y) {
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
