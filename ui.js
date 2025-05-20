// Function to handle intellectual badge click (to drag an intellectual)
export function handleIntellectualBadgeClick(event, regionId, gameState) {
    // Find the region
    const region = gameState.regions.find(r => r.id === regionId);
    
    // Only proceed if region has intellectuals
    if (!region || region.intellectuals <= 0) return;
    
    // Create a new temporary draggable intellectual
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left;
    const y = rect.top;
    
    // Create a temporary intellectual to drag (without actually removing it from the region yet)
    const tempIntellectual = {
        id: 'temp-' + Date.now(),
        sourceRegionId: regionId,
        type: 'intellectual',
        x: x,
        y: y
    };
    
    // Create DOM element for the intellectual
    const intellectualElement = document.createElement('div');
    intellectualElement.className = 'draggable intellectual temp-intellectual';
    intellectualElement.id = `intellectual-${tempIntellectual.id}`;
    intellectualElement.dataset.intellectualId = tempIntellectual.id;
    intellectualElement.dataset.sourceRegionId = regionId;
    intellectualElement.textContent = 'I';
    intellectualElement.style.left = `${x}px`;
    intellectualElement.style.top = `${y}px`;
    
    document.body.appendChild(intellectualElement);
    
    // Setup drag events for this intellectual
    setupDragForTempIntellectual(intellectualElement, gameState);
    
    // Prevent propagation to avoid triggering region click
    event.stopPropagation();
}

// Setup drag functionality specifically for temp intellectuals (from region to region)
function setupDragForTempIntellectual(element, gameState) {
    let isDragging = false;
    let offsetX, offsetY;
    
    // Mouse down - start dragging
    const handleMouseDown = (e) => {
        isDragging = true;
        offsetX = e.clientX - element.getBoundingClientRect().left;
        offsetY = e.clientY - element.getBoundingClientRect().top;
        element.style.zIndex = '1000';
        
        // Prevent default behaviors
        e.preventDefault();
    };
    
    // Mouse move - move element
    const handleMouseMove = (e) => {
        if (!isDragging) return;
        
        const x = e.clientX - offsetX;
        const y = e.clientY - offsetY;
        
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
    };
    
    // Mouse up - stop dragging and check for drop
    const handleMouseUp = (e) => {
        if (!isDragging) return;
        
        isDragging = false;
        element.style.zIndex = '100';
        
        // Check if dropped on a region
        const sourceRegionId = parseInt(element.dataset.sourceRegionId);
        checkDropForTempIntellectual(e.clientX, e.clientY, sourceRegionId, gameState);
        
        // Remove the temporary element
        element.remove();
        
        // Remove event listeners
        element.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };
    
    // Add event listeners
    element.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Trigger mousedown to start dragging immediately
    element.dispatchEvent(new MouseEvent('mousedown', { 
        clientX: parseInt(element.style.left), 
        clientY: parseInt(element.style.top),
        bubbles: true
    }));
}

// Check if a temporary intellectual is dropped on a region
function checkDropForTempIntellectual(x, y, sourceRegionId, gameState) {
    const regions = document.querySelectorAll('.region');
    
    // Check each region
    for (const regionElement of regions) {
        const rect = regionElement.getBoundingClientRect();
        
        // Check if coordinates are within the region
        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
            const targetRegionId = parseInt(regionElement.dataset.regionId);
            
            // Don't allow dropping on the source region
            if (targetRegionId === sourceRegionId) {
                return;
            }
            
            // Transfer intellectual between regions
            transferIntellectual(sourceRegionId, targetRegionId, gameState);
            break;
        }
    }
}

// Transfer an intellectual from one region to another
function transferIntellectual(sourceRegionId, targetRegionId, gameState) {
    const sourceRegion = gameState.regions.find(r => r.id === sourceRegionId);
    const targetRegion = gameState.regions.find(r => r.id === targetRegionId);
    
    if (sourceRegion && targetRegion && sourceRegion.intellectuals > 0) {
        // Remove from source
        sourceRegion.intellectuals--;
        
        // Add to target
        targetRegion.intellectuals++;
        
        // Update displays
        updateIntellectualBadge(sourceRegion);
        updateIntellectualBadge(targetRegion);
        
        return true;
    }
    
    return false;
}

// Update intellectual badge display
function updateIntellectualBadge(region) {
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
                handleIntellectualBadgeClick(e, region.id, window.gameState);
            });
            
            container.appendChild(badge);
        }
    }
}// ui.js - UI rendering and updates
import { calculateTotalConversion } from './mechanics.js';

// Export helper functions for other modules
export function setRegionBackgroundColor(element, type, opacity) {
    let color;
    switch (type) {
        case 'academic':
            color = `rgba(90, 156, 248, ${opacity})`;
            break;
        case 'military':
            color = `rgba(240, 71, 71, ${opacity})`;
            break;
        case 'residential':
            color = `rgba(102, 187, 106, ${opacity})`;
            break;
        default:
            color = `rgba(0, 0, 0, 1)`;
    }
    element.style.backgroundColor = color;
}

// Capitalize first letter helper
export function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Render the entire UI
export function renderUI(appElement, gameState) {
    // Clear existing content
    appElement.innerHTML = '';
    
    // Create resource bar
    const resourceBar = createResourceBar(gameState);
    appElement.appendChild(resourceBar);
    
    // Create region grid
    const gridContainer = createRegionGrid(gameState);
    appElement.appendChild(gridContainer);
    
    // Render intellectuals
    renderIntellectuals(gameState);
    
    // Initial calculation of conversion percentage
    calculateTotalConversion(gameState);
}

// Create the resource bar
function createResourceBar(gameState) {
    const resourceBar = document.createElement('div');
    resourceBar.className = 'resource-bar';
    
    // Create conversion percentage display
    const conversionContainer = document.createElement('div');
    conversionContainer.className = 'conversion-container';
    
    const conversionLabel = document.createElement('div');
    conversionLabel.className = 'conversion-label';
    conversionLabel.textContent = 'Total Conversion:';
    
    const conversionPercentage = document.createElement('div');
    conversionPercentage.className = 'conversion-percentage';
    conversionPercentage.id = 'conversion-percentage';
    conversionPercentage.textContent = '0.0%';
    
    conversionContainer.appendChild(conversionLabel);
    conversionContainer.appendChild(conversionPercentage);
    resourceBar.appendChild(conversionContainer);
    
    // Create resource displays
    const resourceTypes = [
        { type: 'thought', label: 'Thought' },
        { type: 'guns', label: 'Guns' },
        { type: 'volunteers', label: 'Volunteers' }
    ];
    
    resourceTypes.forEach(({ type, label }) => {
        const resource = createResourceDisplay(type, label, gameState.resources[type], gameState);
        resourceBar.appendChild(resource);
    });
    
    return resourceBar;
}

// Create a resource display element
function createResourceDisplay(type, label, value, gameState) {
    const resource = document.createElement('div');
    resource.className = 'resource';
    resource.id = `resource-${type}`;
    
    const labelElement = document.createElement('div');
    labelElement.className = 'resource-label';
    labelElement.textContent = label;
    
    const valueElement = document.createElement('div');
    valueElement.className = 'resource-value';
    valueElement.textContent = Math.floor(value);
    
    resource.appendChild(labelElement);
    resource.appendChild(valueElement);
    
    // Add dropdown menu for thought resource
    if (type === 'thought') {
        const dropdownMenu = createDropdownMenu(gameState);
        resource.appendChild(dropdownMenu);
    }
    
    return resource;
}

// Create dropdown menu for resources
function createDropdownMenu(gameState) {
    const dropdownMenu = document.createElement('div');
    dropdownMenu.className = 'dropdown-menu';
    dropdownMenu.id = 'thought-dropdown';
    
    const intellectualOption = document.createElement('div');
    intellectualOption.className = 'dropdown-item';
    intellectualOption.id = 'create-intellectual';
    intellectualOption.textContent = `Create Intellectual (${gameState.config.thoughtCostForIntellectual})`;
    
    dropdownMenu.appendChild(intellectualOption);
    
    return dropdownMenu;
}

// Create the region grid
function createRegionGrid(gameState) {
    const gridContainer = document.createElement('div');
    gridContainer.className = 'grid-container';
    
    // Set grid template columns based on config
    const regionsPerRow = gameState.config.regionsPerRow;
    gridContainer.style.gridTemplateColumns = `repeat(${regionsPerRow}, 1fr)`;
    
    // Create regions
    gameState.regions.forEach(region => {
        const regionElement = createRegionElement(region, gameState);
        gridContainer.appendChild(regionElement);
    });
    
    return gridContainer;
}

// Create a region element
function createRegionElement(region, gameState) {
    const regionElement = document.createElement('div');
    regionElement.className = `region ${region.type}`;
    regionElement.id = `region-${region.id}`;
    regionElement.dataset.regionId = region.id;
    
    // Set initial state (black with no content for unconverted regions)
    if (region.currentValue <= 0) {
        regionElement.style.backgroundColor = '#000000';
    } else {
        // Calculate transparency based on current value
        const opacity = region.currentValue / gameState.config.maxRegionValue;
        setRegionBackgroundColor(regionElement, region.type, opacity);
    }
    
    // Always create and add value display (hidden when value = 0)
    const valueElement = document.createElement('div');
    valueElement.className = 'region-value';
    valueElement.textContent = Math.floor(region.currentValue);
    valueElement.style.display = region.currentValue > 0 ? 'block' : 'none';
    regionElement.appendChild(valueElement);
    
    // Create and add type display (hidden when value = 0)
    const typeElement = document.createElement('div');
    typeElement.className = 'region-type';
    typeElement.textContent = capitalizeFirstLetter(region.type);
    typeElement.style.display = region.currentValue > 0 ? 'block' : 'none';
    regionElement.appendChild(typeElement);
    
    // Create and add conversion rate display (hidden when value = 0)
    const conversionRateElement = document.createElement('div');
    conversionRateElement.className = 'region-conversion-rate';
    const ratePrefix = region.conversionRate >= 0 ? '+' : '';
    conversionRateElement.textContent = `${ratePrefix}${region.conversionRate.toFixed(1)}/s`;
    conversionRateElement.style.color = region.conversionRate >= 0 ? '#69db7c' : '#ff6b6b';
    conversionRateElement.style.display = region.currentValue > 0 ? 'block' : 'none';
    regionElement.appendChild(conversionRateElement);
    
    // Create and add production rate display (hidden when value = 0)
    const prodRateElement = document.createElement('div');
    prodRateElement.className = 'region-production-rate';
    prodRateElement.textContent = `+${region.productionRatePerSecond.toFixed(1)} ${capitalizeFirstLetter(region.producedResourceType)}/s`;
    prodRateElement.style.display = region.currentValue > 0 ? 'block' : 'none';
    regionElement.appendChild(prodRateElement);
    
    // Create and add adjacency bonus display (hidden when no bonus)
    const adjacencyElement = document.createElement('div');
    adjacencyElement.className = 'region-adjacency-bonus';
    adjacencyElement.style.display = (region.adjacentConvertedCount > 0) ? 'block' : 'none';
    if (region.adjacentConvertedCount > 0) {
        adjacencyElement.textContent = `+${region.adjacencyBonus.toFixed(1)} (${region.adjacentConvertedCount} adj)`;
    }
    regionElement.appendChild(adjacencyElement);
    
    // Create intellectual container
    const intellectualContainer = document.createElement('div');
    intellectualContainer.className = 'intellectual-container';
    intellectualContainer.id = `intellectuals-${region.id}`;
    
    // Add intellectuals if any
    if (region.intellectuals > 0) {
        const intellectualBadge = document.createElement('div');
        intellectualBadge.className = 'intellectual-badge';
        intellectualBadge.textContent = region.intellectuals;
        intellectualBadge.dataset.regionId = region.id;
        intellectualBadge.title = "Click to move an intellectual";
        
        // Make intellectual badge draggable
        intellectualBadge.addEventListener('mousedown', (e) => {
            handleIntellectualBadgeClick(e, region.id, gameState);
        });
        
        intellectualContainer.appendChild(intellectualBadge);
    }
    
    regionElement.appendChild(intellectualContainer);
    
    return regionElement;
}

// Render intellectuals on the screen
function renderIntellectuals(gameState) {
    // Remove existing intellectuals
    const existingIntellectuals = document.querySelectorAll('.draggable.intellectual');
    existingIntellectuals.forEach(el => el.remove());
    
    // Render unassigned intellectuals
    const unassignedIntellectuals = gameState.intellectuals.filter(i => i.assignedRegion === null);
    
    unassignedIntellectuals.forEach(intellectual => {
        const element = document.createElement('div');
        element.className = 'draggable intellectual';
        element.id = `intellectual-${intellectual.id}`;
        element.dataset.intellectualId = intellectual.id;
        element.textContent = 'I';
        element.style.left = `${intellectual.x}px`;
        element.style.top = `${intellectual.y}px`;
        
        document.body.appendChild(element);
    });
    
    // Update intellectual badges in regions
    gameState.regions.forEach(region => {
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
    });
}

// Show click effect animation
export function showClickEffect(x, y, value) {
    const effect = document.createElement('div');
    effect.className = 'click-effect';
    effect.textContent = `+${value}`;
    effect.style.left = `${x}px`;
    effect.style.top = `${y}px`;
    
    document.body.appendChild(effect);
    
    // Remove after animation completes
    setTimeout(() => {
        effect.remove();
    }, 1000);
}

// Toggle dropdown menu
export function toggleDropdownMenu(menuId, show) {
    const menu = document.getElementById(menuId);
    if (menu) {
        if (show) {
            menu.classList.add('active');
        } else {
            menu.classList.remove('active');
        }
    }
}

// Helper to get display level based on value
export function getDisplayLevel(value) {
    if (value >= 150) return 'high';
    if (value >= 70) return 'medium';
    return 'low';
}
