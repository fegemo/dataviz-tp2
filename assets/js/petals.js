class Country {
  constructor({ symbol, name, indices }) {
    this.name = name;
    this.symbol = symbol;
    this.indices = indices;
  }

  averageIndex() {
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

  git in


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
    return new PetalVisualization({
      container: '#main-visualization',
      data: data.map(d => new Country({
        symbol: d.country,
        name: countriesBySymbol(d.country),
        indices: delete d.country &&
          d3.keys(d)
            .map(idxName => d[idxName] = parseNumber(d[idxName]))
      }))
    });
  });
