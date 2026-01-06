---
title: "Exploring r/Ozempic: A Journey Through LLMs, NER, and the Messy Reality of Text Analysis"
date: 2026-01-05
description: "A deep dive into building a production-grade NLP pipeline to extract brand sentiment from Reddit discussions. Lessons learned from iterating through Claude API, Ollama, and OpenRouter."
image: "/img/mermaid.png"
tags: ["data-engineering", "AI", "LLMs", "NER", "text-analysis", "python"]
keywords: ["LLM", "NER", "named entity recognition", "sentiment analysis", "Reddit API", "Claude API", "OpenRouter", "data engineering", "NLP pipeline", "Ozempic", "GLP-1"]
author: "Nikita Goldovsky"
charts: true
chart_data:
  - id: brandSentimentChart
    type: bar
---

<!-- Dashboard Stats -->
<div class="dashboard-stats" id="dashboardStats">
    <div class="stat-card">
        <span class="stat-value" data-target="0" id="statMentions">0</span>
        <span class="stat-label">Total Mentions</span>
    </div>
    <div class="stat-card">
        <span class="stat-value" data-target="0" id="statBrands">0</span>
        <span class="stat-label">Brands Analyzed</span>
    </div>
    <div class="stat-card stat-positive">
        <span class="stat-value" data-target="0" id="statPositive">0%</span>
        <span class="stat-label">Positive</span>
    </div>
    <div class="stat-card stat-negative">
        <span class="stat-value" data-target="0" id="statNegative">0%</span>
        <span class="stat-label">Negative</span>
    </div>
</div>

<!-- Sentiment Overview & Filters -->
<div class="dashboard-row">
    <div class="sentiment-doughnut-container">
        <h4 class="chart-title">Sentiment Distribution</h4>
        <canvas id="sentimentDoughnut"></canvas>
    </div>
    <div class="filter-controls">
        <h4 class="chart-title">Filter by Sentiment</h4>
        <div class="filter-buttons">
            <button class="filter-btn active" data-sentiment="all">All</button>
            <button class="filter-btn filter-positive active" data-sentiment="positive">Positive</button>
            <button class="filter-btn filter-neutral active" data-sentiment="neutral">Neutral</button>
            <button class="filter-btn filter-negative active" data-sentiment="negative">Negative</button>
        </div>
        <p class="filter-hint">Toggle sentiments to show/hide in the chart below</p>
    </div>
</div>

<!-- Main Chart -->
<div class="chart-container brand-sentiment-container">
    <h3 class="chart-title">Top 20 Brands by Mention Count</h3>
    <p class="chart-caption">Click any segment to see the actual Reddit comments</p>
    <div class="chart-wrapper" style="height: 600px;">
        <canvas id="brandSentimentChart"></canvas>
    </div>
</div>

<div id="mentionsTable" class="mentions-table-container">
    <h4 class="filter-header">Select a segment above to view mentions</h4>
    <table class="mentions-table">
        <thead>
            <tr>
                <th>Context</th>
                <th>Text</th>
                <th>Source</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td colspan="3" class="no-results">Click a chart segment to filter mentions</td>
            </tr>
        </tbody>
    </table>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    initBrandSentimentChart(
        'brandSentimentChart',
        'mentionsTable',
        '/data/brand-sentiment-data.json'
    );
});
</script>

---

## The Question

Is Sweetgreen a hidden value stock poised to benefit from GLP-1 medications, changing eating habits, and the "protein everything" era?

To find out, I decided to extract brand mentions (with sentiment) from r/Ozempic posts to understand what products people on GLP-1 medications are actually discussing.

Simple enough, right? Not exactly.

## The Messy Reality of LLM-Powered Data Extraction

My original intention was to demonstrate how LLMs make it possible to explore datasets faster than ever. But I quickly ran into something many practitioners already know: there's a significant gap between getting something that *looks* good and getting something that's actually production-grade.

**The dataset:** Several months of posts (with comments) from r/Ozempic on Reddit.

## Iteration #1: The "Automagic" Approach

My first pipeline was straightforward:

1. Extract Reddit data to JSON with **PRAW** (Python Reddit API Wrapper)
2. Use Claude CLI to find brands, attach sentiment, output to a second JSON file
3. Transform results for visualization

Step 1 was smooth. Step 2? Not so much.

Claude decided to do simple keyword matching based on a list of brands it generated on the fly. Worse, it silently sampled the data instead of evaluating every post. That wasn't going to scale if I wanted repeatable results.

## Iteration #2: Batch to Claude API

Next: send batches to the Claude API for brand + sentiment extraction.

The problem? 1,000 posts with 10+ comments each is a *lot* of tokens. Processing in small batches (10 posts each) meant repeating prompt instructions ~100 times. By batch 8, I was already at **$0.20** in API costs. Shut it down.

## Iteration #3: Local Ollama Model

To avoid API costs entirely, I switched to running **Llama 3.1 8B** locally via Ollama. On an Intel Mac, batch 1 of 50 took so long I thought the process had frozen. Local models weren't going to work for this dataset size.

## Iteration #4: Free OpenRouter Models

With an assist from a friend, I discovered **OpenRouter**, which offers free tiers for models like Gemma and Mistral. This solved my cost problem but surfaced a new one...

### The Chipotle Paradox

When I removed brand name examples from the prompt (to avoid biasing the model), the LLM missed obvious mentions like "Chipotle."

When I added brand examples back, Chipotle became suspiciously overrepresented—explicitly-stated brands were found, but others were overlooked.

What I needed was a way to create a comprehensive brand dictionary without biasing results. But how? Vanilla spaCy models aren't robust enough for this task, and there's no comprehensive database of "every brand, product, and company."

## Iteration #5: The Final Pipeline

Not the most elegant solution, but it worked:

**Step 1: Compress the data**
- Strip metadata (IDs, scores, URLs)
- Filter to high-quality content (upvoted comments only)
- Reduce from **379K tokens to 139K tokens**

**Step 2: One-time powerful LLM pass**
- Pass compressed text through Claude (via web interface)
- Extract ALL brand names found
- Output: `brands_reference.txt`

**Step 3: Use reference list in batch processing**
- Feed the brand list back into the extraction prompt
- Prompt says: "Look for these known brands, AND any others you find"

One discovery: I had to repeatedly prompt Claude with *"Are you sure you didn't miss anything? Do another pass."* to get comprehensive coverage.

The final architecture looked like this:
![Final Pipeline Architecture](/img/mermaid.png)

## Key Takeaways

1. **LLMs are powerful but need guardrails** — Silent sampling and lazy keyword matching are real failure modes
2. **Token economics matter** — Batch processing at scale requires careful cost-benefit analysis
3. **Hybrid approaches win** — Using a powerful model for dictionary generation + cheaper models for batch extraction
4. **Perfect is the enemy of good** — Even with optimizations, there's variance between models. At some point, "good enough" is the right call.

## The Answer

No matter how I sliced the data... ain't nobody talking about Sweetgreen.

But the journey taught me more about production-grade NLP pipelines than any tutorial could.
