---
layout: default
title: Home
---

### WELCOME TO MATSIM-VIZ.

You've found the "MATSim Visualizer" which is an experimental web-based visualization platform for exploring MATSim outputs.

Pick a dataset to explore from those below. More to come!

### SAMPLE VISUALIZATIONS

<div class="posts">
  <!-- Counter so we have rows of  three thumbnails -->
  {% assign i = -1 %}
  {% assign items = site.pages | sort: 'title' %}
  {% for node in items %}
    {% if node.title != null %}
      {% if node.layout == "page" %}

        <!-- Found a page! -->
        {% assign i = i | plus: 1 | modulo: 3 %}  <!-- rows of 3 -->
        {% if i == 0 %}<div class="posts-row">{% endif %}
              <div class="dataset-thumbnail">
                <a href="{{ node.url }}">
                  {% if node.thumbnail %}<img class="thumbnail-image" src="{{node.url}}{{node.thumbnail}}" />
                  {% else %} <img class="thumbnail-image" src="{{site.baseurl}}assets/Wat.png" />{% endif %}
                  <h5 class="thumbnail-title">{{ node.title }}</h5>
                </a>
              </div>
        {% if i == 2 %}</div>{% endif %} <!-- rows of 3 -->
      {% endif %}
    {% endif %}
  {% endfor %}
  {% if i != 2 %}</div>{% endif %} <!-- close last row -->
</div>

### ABOUT THIS SITE

You can find out more about MATSim at [http://matsim.org](http://matsim.org)

