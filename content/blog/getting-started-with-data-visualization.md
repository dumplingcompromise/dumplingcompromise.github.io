---
title: "Getting Started with Data Visualization"
date: 2026-01-05
tags: ["data", "visualization", "tutorial"]
charts: true
chart_data:
  - id: monthlyGrowthChart
    type: line
    data:
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
      datasets:
        - label: "Users"
          data: [1200, 1900, 3000, 5000, 4200, 6100]
          tension: 0.3
          fill: false
  - id: categoryChart
    type: bar
    data:
      labels: ["Product A", "Product B", "Product C", "Product D"]
      datasets:
        - label: "Q1 Sales"
          data: [12, 19, 8, 15]
        - label: "Q2 Sales"
          data: [15, 22, 12, 18]
---

This is a sample blog post demonstrating how to embed interactive charts in your articles. The charts are built with [Chart.js](https://www.chartjs.org/) and automatically styled to match the site's dark theme.

## Adding Charts to Posts

To add charts to a blog post, you need to:

1. Set `charts: true` in the front matter
2. Define your chart data in `chart_data`
3. Add a canvas element with the matching ID

## Line Chart Example

Line charts are great for showing trends over time. Here's an example showing user growth:

<div class="chart-container">
    <h3 class="chart-title">Monthly User Growth</h3>
    <canvas id="monthlyGrowthChart"></canvas>
    <p class="chart-caption">Simulated user growth data for H1 2026</p>
</div>

The data shows steady growth with a slight dip in May before recovering in June. This pattern is common in subscription-based products.

## Bar Chart Example

Bar charts work well for comparing categories. Here's a comparison of quarterly sales:

<div class="chart-container">
    <h3 class="chart-title">Quarterly Sales by Product</h3>
    <canvas id="categoryChart"></canvas>
    <p class="chart-caption">Q1 vs Q2 sales comparison across product lines</p>
</div>

Product B leads in both quarters, while Product C shows the most improvement between Q1 and Q2.

## Creating Your Own Charts

To create a new chart, add a configuration object to the `chart_data` array in your post's front matter:

```yaml
chart_data:
  - id: myChart
    type: bar
    data:
      labels: ["A", "B", "C"]
      datasets:
        - label: "My Data"
          data: [10, 20, 30]
```

Then add the canvas element in your post content:

```html
<div class="chart-container">
    <canvas id="myChart"></canvas>
</div>
```

## Supported Chart Types

Chart.js supports many chart types out of the box:

- **Line** - trends over time
- **Bar** - category comparisons
- **Pie / Doughnut** - proportions
- **Radar** - multivariate data
- **Polar Area** - similar to pie with equal angles
- **Scatter** - correlation between variables

## Next Steps

In future posts, I'll explore more advanced visualizations and show how to work with real datasets. Stay tuned!
