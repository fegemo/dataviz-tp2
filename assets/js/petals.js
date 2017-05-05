
class Country {
  constructor({ symbol, name, indices }) {
    this.name = name;
    this.symbol = symbol;
    this.indices = indices;
  }

  averageIndex() {
    // TODO parece que existe d3.mean(array, funcaoMap)
    return this.average ? this.average :
      (this.average = d3.values(this.indices).reduce
        ((prev, curr) => prev + curr, 0) / d3.keys(this.indices).length
      );
  }
}

class Petal {
  constructor(country, indexName) {
    this.country = country;
    this.indexName = indexName;
  }

  value() {
    return this.country.indices[this.indexName];
  }

  color() {
    return 'white';
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
    // this.createPetals(scales);
    this.createDots(scales);
  }

  determineBounds() {
    this.padding = {
      top: 20,
      right: 20,
      bottom: 80,
      left: 40
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
            .domain([yBounds[1], yBounds[0]])
            // .domain(yBounds)
            .range([0, this.graphDimensions.height])
    };
  }

  createGraph() {
    this.svgEl = this.containerEl.append('svg');
    this.svgEl
      .attr('width', '100%')
      .attr('height', '100%');
        // width: `${this.containerDimensions.width}px`,
        // height: `${this.containerDimensions.height}px`
      // });

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

  createDots(scales) {
    let dotGroupEl = this.mainGroupEl.selectAll('g')
      .data(this.data)
      .enter()
      .append('g')
      .attr('transform', (d, i, nodes) =>
        // `translate(${scales.x(d.name)}, ${this.graphDimensions.height - scales.y(d.averageIndex())})`);
        `translate(${scales.x(d.name)}, ${scales.y(d.averageIndex())})`);
    dotGroupEl.append('circle')
      .attr('fill', 'green')
      .attr('r', 2);
    dotGroupEl.append('line')
      .attr('stroke', 'black')
      .attr('stroke-width', '1')
      .attr('opacity', 0.3)
      .attr('x1', 0)
      .attr('y1', d => this.graphDimensions.height - scales.y(d.averageIndex()))
      // .attr('y1', this.graphDimensions.height)
      .attr('x2', 0)
      .attr('y2', 0);
      // .attr('y2', d => scales.y(d.averageIndex()));
    dotGroupEl.append('text')
      .text(d => d.name)
      .attr('fill', 'black')
      .attr('font-size', 12)
      .attr('font-family', 'Arial')
      .attr('transform', 'rotate(-90)')
      .attr('dx', '-10')
      .attr('dy', '1')
      .attr('text-anchor', 'end');
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
            .map(idxName => d[idxName] = Number.parseFloat(d[idxName]))
      }))
    });

    window.viz = viz;
    window.data = viz.data;


    viz.load();
  });
