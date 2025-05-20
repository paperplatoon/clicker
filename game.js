// game.js - Core game logic
import { createGameState } from './state.js';
import { renderUI, setRegionBackgroundColor, capitalizeFirstLetter, handleIntellectualBadgeClick } from './ui.js';
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
    
    // Store gameState globally for access from event handlers
    window.gameState = gameState;
    
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
            // Update background color based on conversion value
            const opacity = region.currentValue / gameState.config.maxRegionValue;
            setRegionBackgroundColor(regionElement, region.type, opacity);
            
            // Update value display
            const valueElement = regionElement.querySelector('.region-value');
            if (valueElement) {
                valueElement.textContent = Math.floor(region.currentValue);
                valueElement.style.display = region.currentValue > 0 ? 'block' : 'none';
            }
            
            // Update type display
            const typeElement = regionElement.querySelector('.region-type');
            if (typeElement) {
                typeElement.style.display = region.currentValue > 0 ? 'block' : 'none';
            }
            
            // Update conversion rate display
            const conversionRateElement = regionElement.querySelector('.region-conversion-rate');
            if (conversionRateElement) {
                conversionRateElement.style.display = region.currentValue > 0 ? 'block' : 'none';
                
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
                prodRateElement.style.display = region.currentValue > 0 ? 'block' : 'none';
                prodRateElement.textContent = `+${region.productionRatePerSecond.toFixed(1)} ${capitalizeFirstLetter(region.producedResourceType)}/s`;
            }
            
            // Update adjacency bonus display
            const adjacencyElement = regionElement.querySelector('.region-adjacency-bonus');
            if (adjacencyElement) {
                if (region.adjacentConvertedCount > 0 && region.currentValue > 0) {
                    adjacencyElement.style.display = 'block';
                    adjacencyElement.textContent = `+${region.adjacencyBonus.toFixed(1)} (${region.adjacentConvertedCount} adj)`;
                } else {
                    adjacencyElement.style.display = 'none';
                }
            }
            
            // Update intellectual badge in container
            const container = document.getElementById(`intellectuals-${region.id}`);
            if (container) {
                container.innerHTML = '';
                
                if (region.intellectuals > 0) {
                    const badge = document.createElement('div');
                    badge.className = 'intellectual-badge';
                    badge.dataset.regionId = region.id;
                    badge.textContent = region.intellectuals;
                    badge.title = "Click to move an intellectual";
                    
                    // Make intellectual badge draggable
                    badge.addEventListener('mousedown', (e) => {
                        handleIntellectualBadgeClick(e, region.id, gameState);
                    });
                    
                    container.appendChild(badge);
                }
            }
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
