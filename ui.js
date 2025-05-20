// ui.js - UI rendering and updates
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
        
        // Create and add value display
        const valueElement = document.createElement('div');
        valueElement.className = 'region-value';
        valueElement.textContent = Math.floor(region.currentValue);
        regionElement.appendChild(valueElement);
        
        // Create and add type display
        const typeElement = document.createElement('div');
        typeElement.className = 'region-type';
        typeElement.textContent = capitalizeFirstLetter(region.type);
        regionElement.appendChild(typeElement);
        
        // Create and add conversion rate display
        const conversionRateElement = document.createElement('div');
        conversionRateElement.className = 'region-conversion-rate';
        const ratePrefix = region.conversionRate >= 0 ? '+' : '';
        conversionRateElement.textContent = `${ratePrefix}${region.conversionRate.toFixed(1)}/s`;
        conversionRateElement.style.color = region.conversionRate >= 0 ? '#69db7c' : '#ff6b6b';
        regionElement.appendChild(conversionRateElement);
        
        // Create and add production rate display
        const prodRateElement = document.createElement('div');
        prodRateElement.className = 'region-production-rate';
        prodRateElement.textContent = `+${region.productionRatePerSecond.toFixed(1)} ${capitalizeFirstLetter(region.producedResourceType)}/s`;
        regionElement.appendChild(prodRateElement);
    }
    
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
