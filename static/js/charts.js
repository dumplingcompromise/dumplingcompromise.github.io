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
        gridLines: 'rgba(168, 168, 168, 0.2)',
        // Sentiment colors
        positive: '#2ecc71',
        positiveHover: '#27ae60',
        neutral: '#3498db',
        neutralHover: '#2980b9',
        negative: '#e74c3c',
        negativeHover: '#c0392b'
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

/**
 * Initialize Brand Sentiment Chart
 * @param {string} canvasId - Canvas element ID
 * @param {string} tableId - Table container element ID
 * @param {string} dataUrl - URL to preprocessed JSON data
 */
async function initBrandSentimentChart(canvasId, tableId, dataUrl) {
    const canvas = document.getElementById(canvasId);
    const tableContainer = document.getElementById(tableId);

    if (!canvas) {
        console.warn('Brand sentiment chart canvas not found:', canvasId);
        return;
    }

    try {
        const response = await fetch(dataUrl);
        const data = await response.json();
        createBrandSentimentChart(canvas, tableContainer, data);
    } catch (error) {
        console.error('Error loading brand sentiment data:', error);
    }
}

/**
 * Create the stacked horizontal bar chart for brand sentiments
 */
function createBrandSentimentChart(canvas, tableContainer, data) {
    const ctx = canvas.getContext('2d');
    const brands = data.brands;
    const mentions = data.mentions;

    const chartData = {
        labels: brands.map(function(b) { return b.name; }),
        datasets: [
            {
                label: 'Positive',
                data: brands.map(function(b) { return b.positive; }),
                backgroundColor: chartDefaults.colors.positive,
                hoverBackgroundColor: chartDefaults.colors.positiveHover
            },
            {
                label: 'Neutral',
                data: brands.map(function(b) { return b.neutral; }),
                backgroundColor: chartDefaults.colors.neutral,
                hoverBackgroundColor: chartDefaults.colors.neutralHover
            },
            {
                label: 'Negative',
                data: brands.map(function(b) { return b.negative; }),
                backgroundColor: chartDefaults.colors.negative,
                hoverBackgroundColor: chartDefaults.colors.negativeHover
            }
        ]
    };

    const chart = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: chartDefaults.colors.text,
                        font: { family: "'Roboto Mono', monospace" }
                    }
                },
                tooltip: {
                    backgroundColor: chartDefaults.colors.background,
                    titleColor: chartDefaults.colors.primary,
                    bodyColor: chartDefaults.colors.text,
                    borderColor: chartDefaults.colors.primary,
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.raw + ' mentions';
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    ticks: { color: chartDefaults.colors.textSecondary },
                    grid: { color: chartDefaults.colors.gridLines },
                    title: {
                        display: true,
                        text: 'Number of Mentions',
                        color: chartDefaults.colors.textSecondary
                    }
                },
                y: {
                    stacked: true,
                    ticks: { color: chartDefaults.colors.textSecondary },
                    grid: { color: chartDefaults.colors.gridLines }
                }
            },
            onClick: function(event, elements) {
                if (elements.length > 0) {
                    const element = elements[0];
                    const brandIndex = element.index;
                    const datasetIndex = element.datasetIndex;

                    const brandName = brands[brandIndex].name;
                    const sentiments = ['positive', 'neutral', 'negative'];
                    const sentiment = sentiments[datasetIndex];

                    filterAndDisplayMentions(tableContainer, mentions, brandName, sentiment);
                }
            }
        }
    });

    // Store references
    canvas._brandChart = chart;
    canvas._brandData = data;
}

/**
 * Filter mentions and display in table
 */
function filterAndDisplayMentions(tableContainer, mentions, brandName, sentiment) {
    if (!tableContainer) return;

    const filtered = mentions.filter(function(m) {
        return m.brand === brandName && m.sentiment === sentiment;
    });

    // Update header
    const headerEl = tableContainer.querySelector('.filter-header');
    if (headerEl) {
        headerEl.textContent = brandName + ' - ' + sentiment + ' mentions (' + filtered.length + ')';
        headerEl.className = 'filter-header sentiment-' + sentiment;
    }

    // Update table body
    const tbody = tableContainer.querySelector('tbody');
    if (!tbody) return;

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="no-results">No mentions found for this selection</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(function(mention) {
        return '<tr>' +
            '<td class="mention-context">' + escapeHtml(mention.context || '-') + '</td>' +
            '<td class="mention-text">' + escapeHtml(mention.text) + '</td>' +
            '<td class="mention-source"><span class="source-badge source-' + mention.source + '">' + mention.source + '</span></td>' +
            '</tr>';
    }).join('');

    // Scroll table into view
    tableContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
