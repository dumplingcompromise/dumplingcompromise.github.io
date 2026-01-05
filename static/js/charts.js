/**
 * Charts.js - Chart initialization utilities for blog posts
 * Uses Chart.js library (loaded via CDN when page.charts is true)
 */

// Default chart styling to match site theme
const chartDefaults = {
    colors: {
        primary: '#fccd03',
        primaryHover: '#ffd933',
        background: '#222222',
        text: '#ebebea',
        textSecondary: '#a8a8a8',
        gridLines: 'rgba(168, 168, 168, 0.2)'
    }
};

// Apply global Chart.js defaults
if (typeof Chart !== 'undefined') {
    Chart.defaults.color = chartDefaults.colors.text;
    Chart.defaults.borderColor = chartDefaults.colors.gridLines;
    Chart.defaults.font.family = "'Roboto Mono', monospace";
}

/**
 * Initialize charts from page data
 * @param {Object} chartData - Chart configuration from front matter
 */
function initCharts(chartData) {
    if (!chartData || !Array.isArray(chartData)) return;

    chartData.forEach(function(config) {
        const canvas = document.getElementById(config.id);
        if (!canvas) {
            console.warn('Chart canvas not found:', config.id);
            return;
        }

        createChart(canvas, config);
    });
}

/**
 * Create a single chart instance
 * @param {HTMLCanvasElement} canvas - Target canvas element
 * @param {Object} config - Chart configuration
 */
function createChart(canvas, config) {
    const ctx = canvas.getContext('2d');

    // Apply theme colors to datasets
    if (config.data && config.data.datasets) {
        config.data.datasets = config.data.datasets.map(function(dataset, index) {
            return applyThemeToDataset(dataset, index);
        });
    }

    // Merge with default options
    const options = Object.assign({}, getDefaultOptions(config.type), config.options || {});

    new Chart(ctx, {
        type: config.type || 'bar',
        data: config.data,
        options: options
    });
}

/**
 * Apply theme colors to a dataset
 */
function applyThemeToDataset(dataset, index) {
    const colors = [
        chartDefaults.colors.primary,
        '#3498db',
        '#e74c3c',
        '#2ecc71',
        '#9b59b6',
        '#f39c12'
    ];

    const color = colors[index % colors.length];

    return Object.assign({
        backgroundColor: dataset.backgroundColor || color,
        borderColor: dataset.borderColor || color,
        borderWidth: dataset.borderWidth || 2
    }, dataset);
}

/**
 * Get default options based on chart type
 */
function getDefaultOptions(type) {
    const baseOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                labels: {
                    color: chartDefaults.colors.text,
                    font: {
                        family: "'Roboto Mono', monospace"
                    }
                }
            },
            tooltip: {
                backgroundColor: chartDefaults.colors.background,
                titleColor: chartDefaults.colors.primary,
                bodyColor: chartDefaults.colors.text,
                borderColor: chartDefaults.colors.primary,
                borderWidth: 1
            }
        }
    };

    if (type === 'line' || type === 'bar') {
        baseOptions.scales = {
            x: {
                ticks: { color: chartDefaults.colors.textSecondary },
                grid: { color: chartDefaults.colors.gridLines }
            },
            y: {
                ticks: { color: chartDefaults.colors.textSecondary },
                grid: { color: chartDefaults.colors.gridLines }
            }
        };
    }

    return baseOptions;
}

/**
 * Standalone chart creation for inline use
 * Usage: createStandaloneChart('myChart', { type: 'bar', data: {...} })
 */
function createStandaloneChart(canvasId, config) {
    const canvas = document.getElementById(canvasId);
    if (canvas) {
        createChart(canvas, Object.assign({ id: canvasId }, config));
    }
}
