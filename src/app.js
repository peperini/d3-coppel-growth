import * as d3 from 'd3';

const chartSVG = document.querySelector(".chart-svg");
const projection = d3.geoMercator().scale(1500).center([-102, 26]);

async function chart(data) {

    const path = d3.geoPath()
        .projection(projection);

    const svg = d3.select(chartSVG)
        .style("width", "960")
        .style("height", 640);

    await d3.json("https://gist.githubusercontent.com/leenoah1/535b386ec5f5abdb2142258af395c388/raw/a045778d28609abc036f95702d6a44045ae7ca99/geo-data.json").then(function(d) {
        const mx = d;
        svg.append("path")
        .datum(topojson.feature(mx, mx.objects.MEX_adm1))
        .attr('fill', d => '#ddd')
        .attr("stroke", "white")
        .attr("d", path);
    });
    const g = svg.append("g")
        .attr("fill", "none")
        .attr("stroke", "black");

    let dot;

    data.then((data) => {
        dot = g.selectAll("circle")
                .data(data)
                .join("circle")
                .attr("transform", d => `translate(${d})`);

            svg.append("circle")
                .attr("fill", "blue")
                .attr("transform", `translate(${data[0]})`)
                .attr("r", 3);
    });

    let previousDate = -Infinity;

    return Object.assign(svg.node(), {
        update(date) {
            console.log(dot)
            dot.filter(d => d.date > previousDate && d.date <= date).transition().attr("r", 3);
            dot.filter(d => d.date <= previousDate && d.date > date).transition().attr("r", 0);

            previousDate = date;
        }
    });
}

async function data(projection, parseDate) {
    return (
        (await d3.tsv("coppel-tsv-v2.tsv")).map(d => {
            const p = projection(d);
            p.date = parseDate(d.date);
            p.formato = d.formato;
            return p;
        }).sort((a, b) => a.date - b.date)
    )
}

function parseDate() {
    return (d3.utcParse("%Y-%m-%d"))
}

const pData = data(projection, parseDate());
const map = chart(pData);

pData.then(d => {
    const html = document.documentElement;

    const date = d3.utcWeek.every(2).range(...d3.extent(d, d => d.date));
    const dateCount = date.length;

    window.addEventListener("scroll", () => {
        const scrollTop = html.scrollTop;
        const maxScrollTop = html.scrollHeight - window.innerHeight;
        const scrollFraction = scrollTop / maxScrollTop;
        const dateIndex = Math.min(
            dateCount - 1,
            Math.ceil(scrollFraction * dateCount)
        );

        map.then(map => {
            map.update(date[dateIndex]);
        });
    });
});