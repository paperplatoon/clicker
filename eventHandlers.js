// eventHandlers.js
import { addValueToRegion, findRegionById, assignIntellectualToRegion } from './state.js';
import { showClickEffect, toggleDropdownMenu, setRegionBackgroundColor, capitalizeFirstLetter } from './ui.js';
import { canPurchaseItem, createItem, calculateTotalConversion } from './mechanics.js';

// Handle region click
export function handleRegionClick(event, gameState) {
    // Get region ID from clicked element
    const regionId = parseInt(event.currentTarget.dataset.regionId);
    const region = findRegionById(gameState, regionId);
    
    if (region) {
        // Increase region value by the configured amount
        addValueToRegion(region, gameState.config.unitPerClick, gameState);
        
        // Show animation effect
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        showClickEffect(event.clientX, event.clientY, gameState.config.unitPerClick);
        
        // Update UI immediately for responsive feel
        const valueElement = event.currentTarget.querySelector('.region-value');
        if (valueElement) {
            valueElement.textContent = Math.floor(region.currentValue);
        }
        
        // If this is the first time the region gets value > 0, update the UI
        if (region.currentValue > 0 && region.currentValue <= gameState.config.unitPerClick) {
            // This needs a full UI update to add the elements
            updateRegionUI(region, event.currentTarget, gameState);
        } else {
            // Just update the background color transparency
            const opacity = region.currentValue / gameState.config.maxRegionValue;
            setRegionBackgroundColor(event.currentTarget, region.type, opacity);
        }
        
        // Calculate total conversion percentage
        calculateTotalConversion(gameState);
        updateConversionPercentage(gameState);
    }
}

// Update region UI when first converted
function updateRegionUI(region, regionElement, gameState) {
    // Clear existing content
    regionElement.innerHTML = '';
    
    // Create value display
    const valueElement = document.createElement('div');
    valueElement.className = 'region-value';
    valueElement.textContent = Math.floor(region.currentValue);
    regionElement.appendChild(valueElement);
    
    // Create type display
    const typeElement = document.createElement('div');
    typeElement.className = 'region-type';
    typeElement.textContent = capitalizeFirstLetter(region.type);
    regionElement.appendChild(typeElement);
    
    // Create conversion rate display
    const conversionRateElement = document.createElement('div');
    conversionRateElement.className = 'region-conversion-rate';
    const ratePrefix = region.conversionRate >= 0 ? '+' : '';
    conversionRateElement.textContent = `${ratePrefix}${region.conversionRate.toFixed(1)}/s`;
    conversionRateElement.style.color = region.conversionRate >= 0 ? '#69db7c' : '#ff6b6b';
    regionElement.appendChild(conversionRateElement);
    
    // Create production rate display
    const prodRateElement = document.createElement('div');
    prodRateElement.className = 'region-production-rate';
    prodRateElement.textContent = `+${region.productionRatePerSecond.toFixed(1)} ${capitalizeFirstLetter(region.producedResourceType)}/s`;
    regionElement.appendChild(prodRateElement);
    
    // Create intellectual container
    const intellectualContainer = document.createElement('div');
    intellectualContainer.className = 'intellectual-container';
    intellectualContainer.id = `intellectuals-${region.id}`;
    
    // Add intellectuals if any
    if (region.intellectuals > 0) {
        const intellectualBadge = document.createElement('div');
        intellectualBadge.className = 'intellectual-badge';
        intellectualBadge.textContent = region.intellectuals;
        intellectualContainer.appendChild(intellectualBadge);
    }
    
    regionElement.appendChild(intellectualContainer);
    
    // Update background color
    const opacity = region.currentValue / gameState.config.maxRegionValue;
    setRegionBackgroundColor(regionElement, region.type, opacity);
}

// Update the conversion percentage display
function updateConversionPercentage(gameState) {
    const percentageElement = document.getElementById('conversion-percentage');
    if (percentageElement) {
        percentageElement.textContent = `${gameState.totalConversionPercentage.toFixed(1)}%`;
    }
}

// Set up resource hover events
export function setupResourceHoverEvents(gameState) {
    // Get thought resource element
    const thoughtResource = document.getElementById('resource-thought');
    const dropdown = document.getElementById('thought-dropdown');
    
    if (thoughtResource && dropdown) {
        // Show dropdown on hover
        thoughtResource.addEventListener('mouseenter', () => {
            // Only show if enough thought resources
            if (gameState.resources.thought >= gameState.config.thoughtCostForIntellectual) {
                toggleDropdownMenu('thought-dropdown', true);
            }
        });
        
        // Hide dropdown when mouse leaves
        thoughtResource.addEventListener('mouseleave', () => {
            toggleDropdownMenu('thought-dropdown', false);
        });
        
        // Handle intellectual creation
        const createIntellectualButton = document.getElementById('create-intellectual');
        if (createIntellectualButton) {
            createIntellectualButton.addEventListener('click', (e) => {
                handleCreateIntellectual(e, gameState);
            });
        }
    }
    
    // Update dropdown visibility when thought resource changes
    const thoughtValueElement = document.querySelector('#resource-thought .resource-value');
    if (thoughtValueElement) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(() => {
                const thoughtValue = parseFloat(thoughtValueElement.textContent);
                const createButton = document.getElementById('create-intellectual');
                
                if (createButton) {
                    createButton.style.opacity = thoughtValue >= gameState.config.thoughtCostForIntellectual ? '1' : '0.5';
                    createButton.style.pointerEvents = thoughtValue >= gameState.config.thoughtCostForIntellectual ? 'auto' : 'none';
                }
            });
        });
        
        observer.observe(thoughtValueElement, { childList: true, characterData: true, subtree: true });
    }
}

// Handle intellectual creation
function handleCreateIntellectual(event, gameState) {
    // Check if we have enough resources
    if (canPurchaseItem(gameState, 'intellectual')) {
        // Get position for the new intellectual
        const rect = event.currentTarget.getBoundingClientRect();
        const x = rect.right + 20;
        const y = rect.top;
        
        // Create the intellectual
        const intellectual = createItem(gameState, 'intellectual', x, y);
        
        if (intellectual) {
            // Create DOM element for the intellectual
            const intellectualElement = document.createElement('div');
            intellectualElement.className = 'draggable intellectual';
            intellectualElement.id = `intellectual-${intellectual.id}`;
            intellectualElement.dataset.intellectualId = intellectual.id;
            intellectualElement.textContent = 'I';
            intellectualElement.style.left = `${x}px`;
            intellectualElement.style.top = `${y}px`;
            
            document.body.appendChild(intellectualElement);
            
            // Setup drag events for the new intellectual
            setupDragForElement(intellectualElement, gameState);
        }
    }
}

// Set up draggable events
export function setupDraggableEvents(gameState) {
    // Setup for existing intellectuals
    const intellectuals = document.querySelectorAll('.draggable.intellectual');
    intellectuals.forEach(intellectual => {
        setupDragForElement(intellectual, gameState);
    });
}

// Setup drag functionality for an element
function setupDragForElement(element, gameState) {
    let isDragging = false;
    let offsetX, offsetY;
    
    // Mouse down - start dragging
    element.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - element.getBoundingClientRect().left;
        offsetY = e.clientY - element.getBoundingClientRect().top;
        element.style.zIndex = '1000';
        
        // Prevent default behaviors
        e.preventDefault();
    });
    
    // Mouse move - move element
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        const x = e.clientX - offsetX;
        const y = e.clientY - offsetY;
        
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
    });
    
    // Mouse up - stop dragging and check for drop
    document.addEventListener('mouseup', (e) => {
        if (!isDragging) return;
        
        isDragging = false;
        element.style.zIndex = '100';
        
        // Check if dropped on a region
        const intellectualId = parseInt(element.dataset.intellectualId);
        checkDropOnRegion(e.clientX, e.clientY, intellectualId, gameState);
    });
}

// Check if an intellectual is dropped on a region
function checkDropOnRegion(x, y, intellectualId, gameState) {
    const regions = document.querySelectorAll('.region');
    
    // Check each region
    for (const regionElement of regions) {
        const rect = regionElement.getBoundingClientRect();
        
        // Check if coordinates are within the region
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
            const regionId = parseInt(regionElement.dataset.regionId);
            
            // Assign intellectual to region
            if (assignIntellectualToRegion(gameState, intellectualId, regionId)) {
                // Remove draggable element from DOM
                const intellectualElement = document.getElementById(`intellectual-${intellectualId}`);
                if (intellectualElement) {
                    intellectualElement.remove();
                }
                
                // Update intellectual badge in region
                updateRegionIntellectualDisplay(regionId, gameState);
                
                // Break loop as we found a match
                break;
            }
        }
    }
}

// Update intellectual display in a region
function updateRegionIntellectualDisplay(regionId, gameState) {
    const region = findRegionById(gameState, regionId);
    const container = document.getElementById(`intellectuals-${regionId}`);
    
    if (region && container) {
        container.innerHTML = '';
        
        if (region.intellectuals > 0) {
            const badge = document.createElement('div');
            badge.className = 'intellectual-badge';
            badge.textContent = region.intellectuals;
            container.appendChild(badge);
        }
    }
}
