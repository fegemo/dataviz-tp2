
class Country {
  constructor({ symbol, name, indices }) {
    this.name = name;
    this.symbol = symbol;
    this.indices = indices;
  }

  averageIndex() {
    return this.average ? this.average :
      (d3.mean(this.indices, idx => idx.value));
  }
}

class Petal {
  constructor({ name, value }, country) {
    this.value = value;
    this.indexName = name;
    this.country = country;
  }


  dropPetal(flowerContainer, i, nodes) {
    flowerContainer
      .classed(`category`, true)
      .classed(`category-${slugify(this.indexName)}`, true);

    let flowerType = 'ornitop';
    let petalData = Petal.getPetalData(flowerType)
      .concat(Petal.getPetalData(flowerType).map(p => ({ x: p.x, y: -p.y })).reverse());

    flowerContainer.
      append('path')
      .attr('d', petal => Petal.getPathGenerator({
        xScale: d3.scaleLinear().range([0, petal.value * 25]),
        yScale: d3.scaleLinear().range([0, 3])
      })(petalData))
      .attr('stroke', Petal.colorScale(i))
      .attr('stroke-width', 2)
      .attr('fill', Petal.colorScale(i))
      .attr('transform', d => `rotate(${i / nodes.length * 360}) translate(2, 0)`);

  }

  static get colorScale() {
    Petal._colorScale = Petal._colorScale || d3.scaleOrdinal(d3.schemeCategory20);
    return Petal._colorScale;
  }

  static getPetalData(flowerType = 'daisy') {
    let petalByFlowerType = {
      daisy: [
        { x: 0.00, y: 0.00},
        { x: 0.25, y: 1.00},
        { x: 0.50, y: 0.75},
        { x: 0.75, y: 0.50},
        { x: 1.00, y: 0.00}
      ],
      ornitop: [
        { x: 0.00, y: 0.00},
        { x: 0.25, y: 0.20},
        { x: 0.50, y: 0.85},
        { x: 0.75, y: 0.90},
        { x: 1.00, y: 0.00}
      ],
      cylindric: [
        { x: 0.00, y: 0.00},
        { x: 0.05, y: 0.05},
        { x: 0.10, y: 0.10},
        { x: 0.15, y: 0.15},
        { x: 0.20, y: 0.95},
        { x: 0.40, y: 1.00},
        { x: 0.80, y: 1.00},
        { x: 0.85, y: 0.90},
        { x: 0.90, y: 0.85},
        { x: 0.95, y: 0.80},
        { x: 1.00, y: 0.00}
      ]
    }
    return petalByFlowerType[flowerType];
  }

  static getPathGenerator({xScale, yScale}) {
    return d3.line()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y))
      .curve(d3.curveBasis);
  }
}


class PetalVisualization {
  constructor({ container, data }) {
    this.containerEl = d3.select(container);
    this.data = data;
    this.graphPadding = {
      top: 40,
      right: 40,
      bottom: 60,
      left: 50
    };
  }

  load() {
    let availableHeight = window.innerHeight - this.containerEl.node().offsetTop;
    this.containerEl.style('height', `${availableHeight}px`);
    this.createGraph();
    this.determineBounds();
    let scales = this.getScales();
    this.createAxes(scales);
    this.createFlowers(scales);
    this.createLegend();
    this.createSortingControls()
    this.attachHoverPetals();
  }

  determineBounds() {
    this.containerDimensions = {
      width: this.graphEl.node().getClientRects()[0].width,
      height: this.graphEl.node().getClientRects()[0].height
    };

    this.graphDimensions = {
      width: this.containerDimensions.width - (this.graphPadding.left + this.graphPadding.right),
      height: this.containerDimensions.height - (this.graphPadding.top + this.graphPadding.bottom)
    };
  }

  getScales() {
    let yBounds = d3.extent(this.data, d => d.averageIndex());

    return {
      x:  d3.scaleBand()
            .padding(0.05)
            .range([this.graphPadding.left, this.graphPadding.left + this.graphDimensions.width])
            .domain(this.data.map(c => c.name))
            ,
      y:  d3.scaleLinear()
            .domain([yBounds[1], 0])
            .range([0, this.graphDimensions.height])
    };
  }

  createGraph() {
    this.graphEl = this.containerEl.append('svg').classed('graph', true);

    this.mainGroupEl = this.graphEl
      .append('g')
      .attr('transform', `translate(${this.graphPadding.left/2}, ${this.graphPadding.top})` );
  }

  createAxes(scales) {
    let verticalAxisGroupEl = this.graphEl.append('g');
    verticalAxisGroupEl.attr(
      'transform', `translate(${this.graphPadding.left}, ${this.graphPadding.top})`);
    this.verticalAxis = d3.axisLeft(scales.y);
    let verticalAxisNodes = verticalAxisGroupEl.call(this.verticalAxis);
    this.styleAxisNodes(verticalAxisNodes);
  }

  createFlowers(scales) {
    this.flowersEl = this.mainGroupEl
      .selectAll('g')
      .data(this.data);

    let flowerGroupEl = this.flowersEl
      .enter()
      .append('g')
      .classed('flower', true)
      .attr('transform', (d, i, nodes) =>
        `translate(${scales.x(d.name)}, ${scales.y(d.averageIndex())})`);

    // miolo
    const kernelRadius = 2;
    flowerGroupEl.append('circle')
      .attr('fill', 'black')
      .attr('r', kernelRadius);

    // caule
    flowerGroupEl.append('line')
      .attr('stroke', 'black')
      .attr('stroke-width', '1')
      .attr('opacity', 0.3)
      .attr('x1', 0)
      .attr('y1', d => this.graphDimensions.height - scales.y(d.averageIndex()))
      .attr('x2', 0)
      .attr('y2', kernelRadius);

    // texto no caule
    flowerGroupEl.append('text')
      .text(d => d.name)
      .attr('fill', 'black')
      .attr('font-size', 12)
      .attr('font-family', 'Arial')
      .attr('transform', 'rotate(-90)')
      .attr('dx', '-30')
      .attr('dy', '0')
      .attr('text-anchor', 'end');


    // pétalas
    let petalsGroupEl = flowerGroupEl
      .append('g')
      .classed('petals', true);

    petalsGroupEl.selectAll('g.petal')
      .data(d => d.indices.map(
        index => new Petal(d.indices.find(i => i.name === index.name), d)))
      .enter()
      .append('g')
        .classed('petal', true)
        .html(d => d)
        .each((d, i, nodes) => {
          // para cada pétala...
          d.dropPetal(d3.select(nodes[i]), i, nodes);
        });
  }

  attachHoverPetals() {
    let fadeBackInTimeout;

    this.containerEl.selectAll('.category')
      .on('mouseover', (d, i, nodes) => {
        window.clearTimeout(fadeBackInTimeout);

        let hoveredPetalEl = nodes[i];
        let hoveredPetalClass = Array.from(hoveredPetalEl.classList)
          .find(c => /category\-[^\d]+/.test(c));
        this.containerEl.selectAll('.category')
          .classed('faded-out', (d, i, nodes) => !nodes[i].classList.contains(hoveredPetalClass));
      })
      .on('mouseout', (d, i, nodes) => {
        fadeBackInTimeout = window.setTimeout(() => {
          Array.from(nodes).forEach(n => n.classList.remove('faded-out'));
        }, 400);
      });
  }

  createLegend() {
    // housing,income,jobs,community,education,environment,
    // civic engagement,health,life satisfaction,safety,work-life balance
    this.legendEl = this.containerEl.append('svg')
      .classed('legend', true);

    let categories = this.data[0].indices.map(idx => idx.name);

    // cria a flor que fica no alto
    let flowerGroup = this.legendEl.append('g')
      .classed('flower', true)
      .classed('legend-flower', true);

    flowerGroup.selectAll('g.petal')
      .data(categories.map(c => new Petal({ name: c, value: 1}, null)))
      .enter()
      .append('g')
        .attr('transform', `translate(
          ${this.legendEl.node().getClientRects()[0].width/2}, 100) scale(2.5)`)
        .classed('petal', true)
        .classed('category', true)
        .html(d => d)
        .each((d, i, nodes) => {
          // para cada pétala...
          d.dropPetal(d3.select(nodes[i]), i, nodes);
        });

    // cria os ícones das categorias e seus nomes
    let categoryGroups = this.legendEl.append('g')
      .classed('categories', true)
      .attr('transform', `translate(0 ${flowerGroup.node().getBoundingClientRect().bottom})`)
      .selectAll('g.category')
      .data(categories)
      .enter()
      .append('g')
        .classed('category-group', true)
        .attr('transform', (d, i) => `translate(0, ${i*30})`)
        .style('color', (d, i) => Petal.colorScale(i));

    categoryGroups.append('circle')
        .style('fill', d => `url(#fill-for-${slugify(d)})`)
        .attr('r', 12.5)
        .attr('cx', 12.5)
        .attr('cy', 12.5)
        .classed('category', true)
        .each((d, i, nodes) => {
          nodes[i].classList.add(`category-${slugify(d)}`);
        });

    // pattern para os ícones das categorias
    let iconPatterns = categoryGroups.append('defs')
      .append('pattern')
      .attr('id', d => `fill-for-${slugify(d)}`)
      .attr('height', '100%')
      .attr('width', '100%')
      .attr('viewBox', '0 0 25 25')
    iconPatterns.append('rect')
      .attr('fill', 'currentColor')
      .attr('height', 25)
      .attr('width', 25);
    iconPatterns.append('svg:image')
        .attr('xlink:href', d => `assets/img/icons/${slugify(d)}.svg`)
        .attr('height', 25)
        .attr('width', 25)
        .attr('transform', 'translate(6.25 6.25) scale(0.5)');



    categoryGroups.append('text')
      .text(d => d)
      .attr('transform', `translate(30 15)`);
  }

  createSortingControls() {
    this.sortingGroupEl = this.graphEl.append('g')
      .classed('sorting-controls', true)
      .attr('transform', `translate(
        ${this.graphPadding.left}
        ${this.containerDimensions.height - 25})`);

    let sortingByLabel = this.sortingGroupEl.append('text')
      .style('font-size', '14px')
      .text('Sorting by ');

    let sortingGroupsData = [
      { name: 'country name', selected: true },
      { name: 'the index average', selected: false },
      { name: 'a category', selected: false }];

    this.sortingGroups = this.sortingGroupEl.selectAll('.sorting-option')
      .data(sortingGroupsData)

    this.sortingGroups.enter()
      .append('text')
        .classed('sorting-option', true)
        .text(d => d.name)
        .style('font-size', '14px')
        .classed('active', d => d.selected)
        .attr('dx', sortingByLabel.node().getBoundingClientRect().width + 10)
        .attr('dy', (d, i) => (i-1) * 18)
        .each((d, i, nodes) => {
          return d3.select(nodes[i])
            .classed(`sorting-option-${slugify(d.name)}`, true);
        })
        .on('click', (d, i, nodes) => {
          // alert(d.name)
          this.sortBy(d.name, 'housing');
        });

    this.legendEl.selectAll('.legend-flower .petal')
      .on('click', (d, i, nodes) => {
        this.sortBy('a category', d.indexName);
      });
  }

  sortBy(criterion, category = null) {
    let comparison = (a, b) => a > b;
    switch (criterion) {
      case 'country name':
        comparison = (a, b) => {
          let v = d3.descending(a.name, b.name);
          return v;
        }
        break;
      case 'the index average':
        comparison = (a, b) => d3.descending(a.averageIndex(), b.averageIndex());
        break;
      case 'a category':
        comparison = (a, b) => d3.descending(a.indices
          .find(i => i.name === category).value,
          b.indices.find(i => i.name === category).value);
        break;
    }
    this.data.sort(comparison);
    this.updateFlowers();
  }

  updateFlowers() {
    let scales = this.getScales();
    let newX = scales.x.domain(this.data.map(c => c.name)).copy();
    let t = d3.transition()
      .duration(750)
      .ease(d3.easeCubicOut);

    this.flowersEl = this.mainGroupEl
      .selectAll('g.flower')
      .sort((a, b) => newX(a.name) - newX(b.name))
      .transition(t)
        .delay((_, i) => i * 20)
        .attr('transform', (d, i, nodes) =>
          `translate(${newX(d.name)}, ${scales.y(d.averageIndex())})`);
  }

  styleAxisNodes(nodes) {
    nodes.selectAll('.domain')
      .attr({
        fill: 'none',
        'stroke-width': 1,
        'stroke': 'black'
      });
    nodes.selectAll('.tick line')
    .attr({
      fill: 'none',
      'stroke-width': 1,
      'stroke': 'black'
    });
  }

}


// carrega ambos os arquivos
d3.queue()
  .defer(d3.csv, 'data/data.csv')
  .defer(d3.json, 'data/countries.json')
  .await((err, data, countries) => {
    // quando ambos tiverem sido carregados...
    // faz uma tabela hash com o símbolo dos países (e.g., USA) sendo
    // a chave e seu nome em inglês o valor
    let countriesBySymbol = countries.reduce
      ((prev, curr) => ((prev[curr.code] = curr.en) && prev), {});

    // instancia uma nova visualização, fazendo as devidas transformações
    // nos dados
    let viz = new PetalVisualization({
      container: '#main-visualization',
      data: data.map(d => new Country({
        symbol: d.country,
        name: countriesBySymbol[d.country],
        indices: delete d.country &&
          d3.keys(d)
            .map(idxName => ({
              name: idxName,
              value: Number.parseFloat(d[idxName])
            }))
      }))
    });

    window.viz = viz;
    window.data = viz.data;


    viz.load();
  });
