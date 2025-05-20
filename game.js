// game.js - Core game logic
import { createGameState } from './state.js';
import { renderUI, setRegionBackgroundColor, capitalizeFirstLetter } from './ui.js';
import { 
    handleRegionClick, 
    setupResourceHoverEvents, 
    setupDraggableEvents 
} from './eventHandlers.js';
import { 
    updateRegionValues, 
    produceResources, 
    getDisplayLevel 
} from './mechanics.js';

// Game variables
let gameState;
let lastTimestamp = 0;
let appElement;

// Initialize the game
export function initializeGame() {
    // Get the app element
    appElement = document.getElementById('app');
    
    // Create initial game state
    gameState = createGameState();
    
    // Initial render
    renderUI(appElement, gameState);
    
    // Set up event listeners
    setupEventListeners();
    
    // Start the game loop
    requestAnimationFrame(gameLoop);
}

// Set up all event listeners
function setupEventListeners() {
    // Add click listeners to regions
    const regions = document.querySelectorAll('.region');
    regions.forEach(region => {
        region.addEventListener('click', (e) => {
            handleRegionClick(e, gameState);
        });
    });
    
    // Setup resource hover events for dropdown menus
    setupResourceHoverEvents(gameState);
    
    // Setup draggable events for intellectuals
    setupDraggableEvents(gameState);
}

// Main game loop
function gameLoop(timestamp) {
    // Calculate time delta in seconds
    const deltaTime = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;
    
    // Skip first frame
    if (deltaTime > 0) {
        // Update game state
        updateGameState(deltaTime);
        
        // Update UI
        updateUI();
    }
    
    // Continue the loop
    requestAnimationFrame(gameLoop);
}

// Update game state based on time passed
function updateGameState(deltaTime) {
    // Update region values (decay)
    updateRegionValues(gameState, deltaTime);
    
    // Produce resources based on region values
    produceResources(gameState, deltaTime);
}


// Update the UI to reflect current game state
function updateUI() {
    // Update region values
    gameState.regions.forEach(region => {
        const regionElement = document.getElementById(`region-${region.id}`);
        if (regionElement) {
            // Handle unconverted vs converted regions
            if (region.currentValue <= 0) {
                // Unconverted region - all black, no text
                regionElement.style.backgroundColor = '#000000';
                
                // Clear content but keep intellectual container
                const intellectualContainer = regionElement.querySelector('.intellectual-container');
                regionElement.innerHTML = '';
                
                if (intellectualContainer) {
                    regionElement.appendChild(intellectualContainer);
                } else {
                    // Re-add intellectual container if needed
                    const newContainer = document.createElement('div');
                    newContainer.className = 'intellectual-container';
                    newContainer.id = `intellectuals-${region.id}`;
                    regionElement.appendChild(newContainer);
                }
            } else {
                // Converted region - update values
                
                // Update background color based on conversion value
                const opacity = region.currentValue / gameState.config.maxRegionValue;
                setRegionBackgroundColor(regionElement, region.type, opacity);
                
                // Check if we need to add initial elements (first time above 0)
                if (!regionElement.querySelector('.region-value')) {
                    // Create value display
                    const valueElement = document.createElement('div');
                    valueElement.className = 'region-value';
                    regionElement.appendChild(valueElement);
                    
                    // Create type display
                    const typeElement = document.createElement('div');
                    typeElement.className = 'region-type';
                    typeElement.textContent = capitalizeFirstLetter(region.type);
                    regionElement.appendChild(typeElement);
                    
                    // Create conversion rate display
                    const conversionRateElement = document.createElement('div');
                    conversionRateElement.className = 'region-conversion-rate';
                    regionElement.appendChild(conversionRateElement);
                    
                    // Create production rate display
                    const prodRateElement = document.createElement('div');
                    prodRateElement.className = 'region-production-rate';
                    regionElement.appendChild(prodRateElement);
                }
                
                // Update value display
                const valueElement = regionElement.querySelector('.region-value');
                if (valueElement) {
                    valueElement.textContent = Math.floor(region.currentValue);
                }
                
                // Update conversion rate display
                const conversionRateElement = regionElement.querySelector('.region-conversion-rate');
                if (conversionRateElement) {
                    if (region.conversionRate === 0) {
                        conversionRateElement.textContent = `0.0/s`;
                        conversionRateElement.style.color = '#aaaaaa';
                    } else {
                        const ratePrefix = region.conversionRate >= 0 ? '+' : '';
                        conversionRateElement.textContent = `${ratePrefix}${region.conversionRate.toFixed(1)}/s`;
                        conversionRateElement.style.color = region.conversionRate >= 0 ? '#69db7c' : '#ff6b6b';
                    }
                }
                
                // Update production rate display
                const prodRateElement = regionElement.querySelector('.region-production-rate');
                if (prodRateElement) {
                    prodRateElement.textContent = `+${region.productionRatePerSecond.toFixed(1)} ${capitalizeFirstLetter(region.producedResourceType)}/s`;
                }
            }
            
            // Update intellectual badge in container
            updateIntellectualBadge(region);
        }
    });
    
    // Update resource displays
    for (const [resourceType, value] of Object.entries(gameState.resources)) {
        const resourceElement = document.getElementById(`resource-${resourceType}`);
        if (resourceElement) {
            const valueElement = resourceElement.querySelector('.resource-value');
            if (valueElement) {
                valueElement.textContent = Math.floor(value);
            }
        }
    }
    
    // Update conversion percentage display
    const percentageElement = document.getElementById('conversion-percentage');
    if (percentageElement) {
        percentageElement.textContent = `${gameState.totalConversionPercentage.toFixed(1)}%`;
    }
}

// Helper function to update intellectual badge
function updateIntellectualBadge(region) {
    const container = document.getElementById(`intellectuals-${region.id}`);
    if (container) {
        container.innerHTML = '';
        
        if (region.intellectuals > 0) {
            const badge = document.createElement('div');
            badge.className = 'intellectual-badge';
            badge.textContent = region.intellectuals;
            container.appendChild(badge);
        }
    }
}
