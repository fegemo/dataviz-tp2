
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
  constructor(country, indexName) {
    this.country = country;
    this.indexName = indexName;
  }


  get slugifiedIndexName() {
    return this.indexName
      .replace(/\s/gi, '-')
      .toLowerCase();
  }

  get value() {
    return this.country.indices
      .find(idx => idx.name === this.indexName)
      .value;
  }

  dropPetal(flowerContainer, i, nodes) {
    flowerContainer
      .classed(`petal-${i}`, true)
      .classed(`petal-${this.slugifiedIndexName}`, true);

    [1, -1].forEach(v => {
      flowerContainer
        .append('path')
        .attr('d', petal => Petal.getPathGenerator({
          xScale: d3.scaleLinear().range([0, petal.value * 25]),
          yScale: d3.scaleLinear().range([0, v * 3])
        })(Petal.getPetalData('ornitop')))
        .attr('stroke', Petal.colorScale(i))
        .attr('stroke-width', 2)
        .attr('fill', Petal.colorScale(i))
        .attr('transform', d => `rotate(${i / nodes.length * 360}) translate(2 0)`);
    });
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
  }

  load() {
    let availableHeight = window.innerHeight - this.containerEl.node().offsetTop;
    this.containerEl.style('height', `${availableHeight}px`);
    this.determineBounds();
    this.createGraph();
    let scales = this.getScales();
    this.createAxes(scales);
    this.createFlowers(scales);
    this.attachHoverPetals();
  }

  determineBounds() {
    this.padding = {
      top: 40,
      right: 40,
      bottom: 40,
      left: 50
    };

    this.containerDimensions = {
      width: this.containerEl.node().getClientRects()[0].width,
      height: this.containerEl.node().getClientRects()[0].height
    };

    this.graphDimensions = {
      width: this.containerDimensions.width - (this.padding.left + this.padding.right),
      height: this.containerDimensions.height - (this.padding.top + this.padding.bottom)
    };
  }

  getScales() {
    let yBounds = d3.extent(this.data, d => d.averageIndex());

    return {
      x:  d3
            .scaleBand()
            .padding(0.05)
            .range([this.padding.left, this.padding.left + this.graphDimensions.width])
            .domain(this.data.map(c => c.name))
            ,
      y:  d3.scaleLinear()
            .domain([yBounds[1], 0])
            .range([0, this.graphDimensions.height])
    };
  }

  createGraph() {
    this.svgEl = this.containerEl.append('svg');
    this.svgEl
      .attr('width', '100%')
      .attr('height', '100%');

    this.mainGroupEl = this.svgEl.append('g');
    this.mainGroupEl
      .attr('transform', `translate(${this.padding.left/2}, ${this.padding.top})` );
  }

  createAxes(scales) {
    let verticalAxisGroupEl = this.svgEl.append('g');
    verticalAxisGroupEl.attr(
      'transform', `translate(${this.padding.left}, ${this.padding.top})`);
    this.verticalAxis = d3.axisLeft(scales.y);
    let verticalAxisNodes = verticalAxisGroupEl.call(this.verticalAxis);
    this.styleAxisNodes(verticalAxisNodes);
  }

  createFlowers(scales) {
    let flowerGroupEl = this.mainGroupEl.selectAll('g')
      .data(this.data)
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
        index => new Petal(d, index.name)))
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

    this.mainGroupEl.selectAll('.petal')
      .on('mouseover', (d, i, nodes) => {
        window.clearTimeout(fadeBackInTimeout);

        let hoveredPetalEl = nodes[i];
        let hoveredPetalClass = Array.from(hoveredPetalEl.classList)
          .find(c => /petal\-\d+/.test(c));
        this.mainGroupEl.selectAll(`.petal`)
          .classed('faded-out', (d, i, nodes) => !nodes[i].classList.contains(hoveredPetalClass));
      })
      .on('mouseout', (d, i, nodes) => {
        fadeBackInTimeout = window.setTimeout(() => {
          Array.from(nodes).forEach(n => n.classList.remove('faded-out'));
        }, 400);
      });
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
