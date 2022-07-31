console.log("Assignment: CS416 Narrative Visualization Project")
console.log("Author: Alex Chomiak")
console.log("NetID: achomi2")
console.log(d3)
// * Grab reference to parent element for vis
document.body.style.width = "100%"
document.body.style.height = "100%"

const parent = document.getElementById("visContainer")
const stage = document.getElementById("visStage")
const backButton = document.getElementById("backButton")
backButton.disabled = true

let currentScene = null

function createScene(id) {
    const scene = document.createElement("div")
    scene.className = "scene"
    scene.id = id
    scene.style.width = "0px"
    scene.style.height = "0px"
    scene.style.visibility = "hidden"
    idToScene[id] = scene
    stage.appendChild(scene)
    return scene
}

let idToScene = {}

function createImageElement(imageUrl) {
    const image = document.createElement("img")
    image.src = imageUrl
    return image
}

const callStack = []


function setScene(id, addToCallStack = true) {


    if (currentScene) {
        if (addToCallStack) {
            callStack.push({
                from: currentScene != null ? currentScene.id : null,
                to: id
            })
        }
        backButton.disabled = false
        currentScene.style.width = "0px"
        currentScene.style.height = "0px"
        currentScene.style.visibility = "hidden"
    }
    parent.innerHTML = ""
    currentScene = idToScene[id]
    currentScene.style.visibility = "visible"
    currentScene.style.width = "100%"
    currentScene.style.height = "100%"
    parent.appendChild(currentScene)
    if (currentScene.inject && !currentScene.injected) {
        currentScene.inject()
        currentScene.injected = true
    }
}

function navigateBack() {
    console.log(callStack)
    if (callStack.length > 0) {
        const lastCall = callStack.pop()
        setScene(lastCall.from, false)

        if (callStack.length == 0) {
            backButton.disabled = true
        }
        console.log(callStack)

    }
}

/*
   convert measurement string to meters from km, cm, mm, or m
*/
function getMeters(measurement) {
    if (measurement.endsWith("km")) {
        return parseFloat(measurement.replace("km", "")) * 1000
    } else if (measurement.endsWith("cm")) {
        return parseFloat(measurement.replace("cm", "")) / 100
    } else if (measurement.endsWith("mm")) {
        return parseFloat(measurement.replace("mm", "")) / 1000
    } else if (measurement.endsWith("m")) {
        return parseFloat(measurement.replace("m", ""))
    }
}

/*
    Extract diameter from measurement string (if range, return average)
*/
function getDiameter(measurement) {
    const diameter = measurement.replace(/ /g, '').split("-").map(m => {
        return getMeters(m)
    })
    return diameter.reduce((acc, curr) => {
        return acc + curr
    }) / diameter.length
}

/*
    Get distances from string 'CA Distance Minimum (LD | au)'
    format: "3.75 | 0.00962"

    return: {
        "LD": 3.75,
        "au": 0.00962
    }
*/
function getDistances(measurement, prefix) {
    const distances = measurement.replace(/ /g, '').split("|")
    const ld = `${prefix}LD`
    const au = `${prefix}au`
    let distancesObj = {}
    distancesObj[ld] = parseFloat(distances[0])
    distancesObj[au] = parseFloat(distances[1])
    return distancesObj
}


function stringToHTML(string) {
    const div = document.createElement("div")
    div.style.width = "100%"
    div.style.height = "100%"
    div.innerHTML = string
    return div
}

// get year as integer from "MM/DD/YYYY"
function getYear(date) {
    let year = date.split("-")[0]
    return parseInt(year)
}

// * Async main function
async function main() {
    const data = (await d3.csv(window.location.href + "/data.csv")).map(d => {
        const diam = getDiameter(d['Diameter'])
        return {
            ...d, "Diameter": diam,
            ...getDistances(d['CA Distance Minimum (LD | au)'], "CAminDistance"),
            "RelativeVelocity": parseFloat(d['V relative (km/s)'])
        }
    })
    window.data = data
    console.log(data)
    const introScene = createScene("intro")
    introScene.appendChild(stringToHTML(`<div> 
    <h1>Near Earth Objects from 1900-2021</h1> 
    <h3><i>Narrative visualization project for CS416 (achomi2@illinois.edu)</i></h3> 
    <img src="${window.location.href}nearearth.gif" alt="gun violence" width="50%" height="50%" >
    <p> This is a interactive slideshow digging into the dataset Near Earth Objects observed by NASA from 1900-2021</p>
    <a href="https://www.kaggle.com/datasets/ramjasmaurya/near-earth-objects-observed-by-nasa">Link to Dataset</a>
    <button onclick="setScene('scene1')">Start</button>
    </div>`))


    /*
        Context Scene for Asteroid Data
    */
    const contextScene = createScene("context")
    contextScene.appendChild(stringToHTML(`<div width="100%" height="100%">
          <h1 id='contextTitle'></h1>
          <img id='contextImage' width = 400px height = 400px/>
          <div id='contextDescription'></div>
          <button onclick="setScene('scene1', false)">Back</button>
        </div>`))
    
    /*
        Context Scene for Asteroid Data
    */
        const contextScene2 = createScene("context2")
        contextScene2.appendChild(stringToHTML(`<div width="100%" height="100%">
              <h1 id='contextTitle2'></h1>
              <img id='contextImage2' width = 400px height = 400px/>
              <div id='contextDescription2'></div>
              <button onclick="setScene('scene2', false)">Back</button>
            </div>`))

    /*
         Scene 1: Show D3 Object Line craph
    */
    const scene1 = createScene("scene1")
    scene1.appendChild(stringToHTML(`<div width="100%" height="100%">
    <h1>Observed Near Earth Objects by NASA from 1990-2021</h1>
    <p> Observed near earth objects have increased drastically year over year towards the end of the 20th century. This
    is probably due to the rapid improvement in radio & telescopic technology, which has allowed NASA to more efficiently observe Near Earth Objects as they
    approach the earth. As technology only improves, we can expect the number of objects we observe to only increase. We will be able to more accurately observe these objects
    and their respective trajectories. </p>
    <p>
    <b> Click the annotations for more context! </b>
    </p>
    <div>
    <svg id="scene1svg" width="800px" height="600px"></svg>
    </div>
    <button onclick="setScene('scene2')"> 🌎 See the close calls 😳 </button>

    </div>`))

    let yearMap = {}

    data.forEach(d => {
        const year = getYear(d["Close-Approach (CA) Date"])
        if (!yearMap[year]) {
            yearMap[year] = 0
        }
        yearMap[year] += 1
    })
    const years = Object.keys(yearMap).filter(year => year >= 1900 && year <= 2021)
    const neoData = []
    years.forEach(year => {
        neoData.push({
            year: new Date(parseInt(year), 0),
            count: yearMap[year]
        })
    })
    scene1.inject = function () {
        const svg = d3.select("#scene1").select("svg")
        let margin = { top: 20, right: 20, bottom: 30, left: 50 };
        let width = parseFloat(svg.attr("width")) - margin.left - margin.right
        let height = parseFloat(svg.attr("height")) - margin.top - margin.bottom
        let g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        const x = d3.scaleTime()
            .domain([new Date(1900, 0), new Date(2021, 0)])
            .range([0, width])
        g.append("g")
            .attr("transform", "translate(0," + height + ")")
            .attr("class", "axis-white")
            .call(d3.axisBottom(x).ticks(5))



        const y = d3.scaleLinear()
            .domain([0, d3.max(years, year => yearMap[year])])
            .range([height, 0])
        g.append("g")
            .attr("class", "axis-white")
            .call(d3.axisLeft(y));

        g.append("path")
            .datum(neoData)
            .attr("class", "path-blue")
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()
                .x(function (d) { return x(d.year) })
                .y(function (d) { return y(d.count) })
            )

        svg.append('g')
            .attr('transform', 'translate(' + 15 + ', ' + 300 + ')')
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('transform', 'rotate(-90)')
            .attr('stroke', 'white')
            .attr('fill', 'white')
            .text('Near Earth Object Count')

        svg.append('g')
            .attr('transform', 'translate(' + 360 + ', ' + 595 + ')')
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('stroke', 'white')
            .attr('fill', 'white')
            .text('Year')


        // ADD ANNOTATIONS
        //Add annotations
        const labels = [
            {
                y: y(yearMap[1900]),
                x: x(new Date(1900, 0)),
                dy: -50,
                dx: 30,
                contextData: {
                    title: "1900-Jan-29 - 4660 Nereus",
                    description: `<div>
                    <p> 4660 Nereus, provisional designation 1982 DB, is a small (about 0.33 kilometres (0.21 mi)) asteroid. It was discovered by Eleanor F. Helin on 28 February 1982, approximately a month after it passed 4.1 million km (11 LD) from Earth.[1]

                    Nereus is potentially an important asteroid with a high albedo. It is an Apollo and Mars-crosser, with an orbit that frequently comes close to Earth, and because of this it is exceptionally accessible to spacecraft. Indeed, because of its small size and close orbit, its delta-V for rendezvous of ~5 km/s is smaller than the Moon's, which is about 6.3 km/s.[5]
                    
                    Nereus makes seven approaches to Earth of less than 5 million km between 1900 and 2100.[6] The closest will be on 14 February 2060, at 1.2 million km.[6] The most recent closest approach was on 11 December 2021, when it was 3.9 million km away.[6] During the 2021 approach, the asteroid peaked around apparent magnitude 12.6, requiring a telescope with around a 100mm objective lens to be visually seen. Its orbital period of 1.82 yr[2] also puts it somewhat near a 2:1 orbital resonance with Earth, which means that an approximately 4-year mission could depart for and return from the asteroid on relatively near passes to the Earth.[citation needed
                        </p>
                        <p>
                        <a href="https://en.wikipedia.org/wiki/4660_Nereus">Link to Wikipedia Source</a>
                        </p>
                        `,
                    imageSrc: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Nereus_Goldstone_PIA24566_animated.gif"
                },
                note: {
                    "title": "1900-Jan-29 - 4660 Nereus"
                }
            },
            {
                y: y(yearMap[1931]),
                x: x(new Date(1931, 0)),
                dy: -50,
                dx: -50,
                contextData: {
                    title: "1931-Dec-13 - 3200 Phaethon",
                    description: `<div>
                    <p> 
                    3200 Phaethon /ˈfeɪ.əθɒn/ (previously sometimes spelled Phaeton), provisional designation 1983 TB, is an active[8] Apollo asteroid with an orbit that brings it closer to the Sun than any other named asteroid (though there are numerous unnamed asteroids with smaller perihelia, such as (137924) 2000 BD19).[9] For this reason, it was named after the Greek myth of Phaëthon, son of the sun god Helios. It is 5.8 km (3.6 mi) in diameter[6] and is the parent body of the Geminids meteor shower of mid-December. With an observation arc of 35+ years, it has a very well determined orbit.[1] The 2017 Earth approach distance of about 10 million km was known with an accuracy of ±700 m.[1]
                    Phaethon was the first asteroid to be discovered using images from a spacecraft. Simon F. Green and John K. Davies discovered it in images from October 11, 1983, while searching Infrared Astronomical Satellite (IRAS) data for moving objects. It was formally announced on October 14 in IAUC 3878 along with optical confirmation by Charles T. Kowal, who reported it to be asteroidal in appearance. Its provisional designation was 1983 TB, and it later received the numerical designation and name 3200 Phaethon in 1985.
                    </p>
                        <p>
                        <a href="https://en.wikipedia.org/wiki/3200_Phaethon">Link to Wikipedia Source</a>
                        </p>
                        `,
                    imageSrc: "https://upload.wikimedia.org/wikipedia/commons/2/2e/PIA22185.gif"
                },
                note: {
                    "title": "1931-Dec-13 - 3200 Phaethon"
                }
            },
            {
                y: y(yearMap[1994]),
                x: x(new Date(1994, 0)),
                dy: -150,
                dx: 5,
                contextData: {
                    title: "1994-Aug-25 - 1620 Geographos",
                    description: `<div>
                    <p> 
                    1620 Geographos (/dʒiːoʊˈɡræfɒs/), provisional designation 1951 RA, is a highly elongated, stony asteroid, near-Earth object and potentially hazardous asteroid of the Apollo group, with a mean-diameter of approximately 2.5 km (1.6 mi). It was discovered on 14 September 1951, by astronomers Albert George Wilson and Rudolph Minkowski at the Palomar Observatory in California, United States.[3] The asteroid was named in honor of the National Geographic Society.[2]
                    </p>
                        <p>
                        <a href="https://en.wikipedia.org/wiki/1620_Geographos">Link to Wikipedia Source</a>
                        </p>
                        `,
                    imageSrc: "https://upload.wikimedia.org/wikipedia/commons/6/6c/1620Geographos_%28Lightcurve_Inversion%29.png"
                },
                note: {
                    "title": "1994-Aug-25 - 1620 Geographos"
                }
            },
            {
                y: y(yearMap[1983]),
                x: x(new Date(1983, 0)),
                dy: -50,
                dx: -10,
                contextData: {
                    title: "1983-Feb-01 - 6239 Minos",
                    description: `<div>
                    <p> 
                    6239 Minos (prov. designation: 1989 QF) is a bright sub-kilometer near-Earth object, classified as a potentially hazardous asteroid of the Apollo group. It was discovered on 31 August 1989, by American astronomer couple Carolyn and Eugene Shoemaker at the Palomar Observatory in California. The asteroid has a rotation period of 3.6 hours and measures approximately 0.5 kilometers (0.3 miles) in diameter. It makes frequent close approaches to Mars, Earth, and Venus.[1]                    </p>
                        <p>
                        <a href="https://en.wikipedia.org/wiki/1620_Geographos">Link to Wikipedia Source</a>
                        </p>
                        `,
                    imageSrc: ""
                },
                note: {
                    "title": "1983-Feb-01 - 6239 Minos"
                }
            },
            {
                y: y(yearMap[1954]),
                x: x(new Date(1954, 0)),
                dy: -75,
                dx: 30,
                contextData: {
                    title: "1983-Feb-01 - 69230 Hermes",
                    description: `<div>
                    <p> 
                    69230 Hermes is a sub-kilometer sized asteroid and binary system on an eccentric orbit,[10] classified as a potentially hazardous asteroid and near-Earth object of the Apollo group, that passed Earth at approximately twice the distance of the Moon on 30 October 1937. The asteroid was named after Hermes from Greek mythology.[2] It is noted for having been the last remaining named lost asteroid, rediscovered in 2003. The S-type asteroid has a rotation period of 13.9 hours.[7] Its synchronous companion was discovered in 2003. The primary and secondary are similar in size; they measure approximately 810 meters (2,700 ft) and 540 meters (1,800 ft) in diameter, respectively.                       <p>
                        <a href="https://en.wikipedia.org/wiki/69230_Hermes">Link to Wikipedia Source</a>
                        </p>
                        `,
                    imageSrc: "https://upload.wikimedia.org/wikipedia/commons/7/73/Hermes_planetoid.jpg"
                },
                note: {
                    "title": "1983-Feb-01 - 69230 Hermes"
                }
            }
        ].map(l => {
            l.subject = { radius: 12 }
            l.subject.onClick = function () {
                let contextTitle = contextScene.querySelector("#contextTitle")
                let contextDescription = contextScene.querySelector("#contextDescription")
                let contextImage = contextScene.querySelector("#contextImage")
                contextTitle.innerText = l.contextData.title
                contextDescription.innerHTML = l.contextData.description
                if (l.contextData.imageSrc && l.contextData.imageSrc.length > 0) {
                    contextImage.src = l.contextData.imageSrc
                    contextImage.style.width = "400px"
                    contextImage.style.height = "400px"
                } else {
                    contextImage.style.width = 0
                    contextImage.style.height = 0
                }
                if (l.onClick)
                    l.onClick()
                else {
                    setScene("context", false)
                }
            }


            return l
        })


        window.makeAnnotations = d3.annotation()
            .annotations(labels)
            .type(d3.annotationCalloutCircle)
            .on('subjectover', function (annotation) {
                annotation.type.a.selectAll("g.annotation-connector, g.annotation-note")
                    .classed("hidden", false)
            })
            .on('subjectout', function (annotation) {
                annotation.type.a.selectAll("g.annotation-connector, g.annotation-note")
                    .classed("hidden", true)
            })
            .on('subjectclick', function (annotation) {
                if (annotation.subject && annotation.subject.onClick) {
                    annotation.type.a.selectAll("g.annotation-connector, g.annotation-note")
                        .classed("fohidden", true)
                    annotation.subject.onClick()

                }
            })

        g.append("g")
            .attr("class", "annotation-group")
            .call(makeAnnotations)

        g.selectAll("g.annotation-connector, g.annotation-note")
            .classed("hidden", true)
    }

    /*
         Scene 2: Show Asteroid Size by Weight graph
    */
    const scene2 = createScene("scene2")
    scene2.appendChild(stringToHTML(`<div width="100%" height="100%">
   <h1>Asteroids have had multiple close calls with Earth</h1>
   <p> There have been multiple close calls with asteroids coming near earth! Hover over the visualization to see the names of Asteroids that have come close to earth. The bigger the radius of the dot,
   the larger the Diameter of the Asteroid that has made a close call! </p>
   <p>
   <b> Click the RED circles for more context! :)</b>

   </p>
   <div>
   <svg id="scene2svg" width="800px" height="600px"></svg>
   </div>
   <button onclick="setScene('scene3')"> Next </button>

   </div>`))
    scene2.inject = function () {
        const svg = d3.select("#scene2").select("svg")
        let margin = { top: 20, right: 20, bottom: 30, left: 50 };
        let width = parseFloat(svg.attr("width")) - margin.left - margin.right
        let height = parseFloat(svg.attr("height")) - margin.top - margin.bottom
        let g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        svg.append('g')
        .attr('transform', 'translate(' + 15 + ', ' + 300 + ')')
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('transform', 'rotate(-90)')
        .attr('stroke', 'white')
        .attr('fill', 'white')
        .text('Distance (LD)')

    svg.append('g')
        .attr('transform', 'translate(' + 360 + ', ' + 595 + ')')
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('stroke', 'white')
        .attr('fill', 'white')
        .text('Relative Velocity (km/s)')

        // * Create X Scale & axis
        let velocities = data.map(d => d['RelativeVelocity'])
        let maxV = d3.max(velocities)
        let x = d3.scaleLinear()
            .domain([0, maxV])
            .range([0, width])


        let xAxis = g.append("g")
            .attr("transform", "translate(0," + height + ")")
            .attr("class", "axis-white")
            .call(d3.axisBottom(x))


        // * Create Y Scale & axis
        let distances = data.map(d => d['CAminDistanceLD'])
        let maxD = d3.max(distances)
        let y = d3.scaleLinear()
            .domain([0, maxD])
            .range([height, 0])

        let yAxis = g.append("g")
            .attr("class", "axis-white")
            .call(d3.axisLeft(y));


        let contextMap = {
            "3200 Phaethon (1983 TB)": {
                contextData: {
                    title: "3200 Phaethon",
                    description: `<div>
                    <p> 
                    3200 Phaethon /ˈfeɪ.əθɒn/ (previously sometimes spelled Phaeton), provisional designation 1983 TB, is an active[8] Apollo asteroid with an orbit that brings it closer to the Sun than any other named asteroid (though there are numerous unnamed asteroids with smaller perihelia, such as (137924) 2000 BD19).[9] For this reason, it was named after the Greek myth of Phaëthon, son of the sun god Helios. It is 5.8 km (3.6 mi) in diameter[6] and is the parent body of the Geminids meteor shower of mid-December. With an observation arc of 35+ years, it has a very well determined orbit.[1] The 2017 Earth approach distance of about 10 million km was known with an accuracy of ±700 m.[1]
                    Phaethon was the first asteroid to be discovered using images from a spacecraft. Simon F. Green and John K. Davies discovered it in images from October 11, 1983, while searching Infrared Astronomical Satellite (IRAS) data for moving objects. It was formally announced on October 14 in IAUC 3878 along with optical confirmation by Charles T. Kowal, who reported it to be asteroidal in appearance. Its provisional designation was 1983 TB, and it later received the numerical designation and name 3200 Phaethon in 1985.
                    </p>
                        <p>
                        <a href="https://en.wikipedia.org/wiki/3200_Phaethon">Link to Wikipedia Source</a>
                        </p>
                        `,
                    imageSrc: "https://upload.wikimedia.org/wikipedia/commons/2/2e/PIA22185.gif"
                }
            }, 
            "53319 (1999 JM8)": {
                            contextData: {
                title: "53319 (1999 JM8)",
                description: `<div>
                <p> 
                (53319) 1999 JM8 is an asteroid, slow rotator and tumbler, classified as a near-Earth object and potentially hazardous asteroid (PHA) of the Apollo group, approximately 7 kilometers (4 miles) in diameter, making it the largest PHA known to exist.[12] It was discovered on 13 May 1999, by astronomers of the Lincoln Near-Earth Asteroid Research at the Lincoln Laboratory's Experimental Test Site near Socorro, New Mexico.[2]
                </p>
                    <p>
                    <a href="https://en.wikipedia.org/wiki/(53319)_1999_JM8">Link to Wikipedia Source</a>
                    </p>
                    `,
                imageSrc: "https://upload.wikimedia.org/wikipedia/commons/6/6f/Asteroid_1999_JM8.gif"
            }
            },
            "4179 Toutatis (1989 AC)": {
                contextData: {
                    title: "4179 Toutatis (1989 AC)",
                    description: `<div>
                    <p> 
                    4179 Toutatis, provisional designation 1989 AC, is an elongated, stony asteroid and slow rotator,[11] classified as a near-Earth object and potentially hazardous asteroid of the Apollo asteroid and Alinda asteroid groups,[citation needed] approximately 2.5 kilometers in diameter. Discovered by French astronomer Christian Pollas at Caussols in 1989, the asteroid was named after Toutatis from Celtic mythology.[1][2]

                    Toutatis is also a Mars-crosser asteroid with a chaotic orbit produced by a 3:1 resonance with the planet Jupiter, a 1:4 resonance with the planet Earth, and frequent close approaches to the terrestrial planets, including Earth.[12] In December 2012, Toutatis passed within about 18 lunar distances of Earth. The Chinese lunar probe Chang'e 2 flew by the asteroid at a distance of 3.2 kilometers and a relative velocity of 10.73 km/s.[13] Toutatis approached Earth again in 2016, but will not make another notably close approach until 2069.[14]
                    
                                        </p>
                        <p>
                        <a href="https://en.wikipedia.org/wiki/4179_Toutatis">Link to Wikipedia Source</a>
                        </p>
                        `,
                    imageSrc: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Asteroid_4179_Toutatis_close-up.jpg/256px-Asteroid_4179_Toutatis_close-up.jpg"
                }
            },
            "16960 (1998 QS52)": {
                contextData: {
                    title: "16960 (1998 QS52)",
                    description: `<div>
                    <p> 
                    (16960) 1998 QS52 (prov. designation: 1998 QS52) is a stony asteroid on a highly eccentric orbit, classified as near-Earth object and potentially hazardous asteroid of the Apollo group, approximately 4.1 kilometers (2.5 mi) in diameter. It was discovered on 25 August 1998, by astronomers of the LINEAR program at Lincoln Laboratory's Experimental Test Site near Socorro, New Mexico, in the United States.[2] This asteroid is one of the largest potentially hazardous asteroid known to exist.[8]
                                        </p>
                        <p>
                        <a href="https://en.wikipedia.org/wiki/(16960)_1998_QS52">Link to Wikipedia Source</a>
                        </p>
                        `,
                    imageSrc: ""
                }
            },
            "1981 Midas (1973 EA)": {
                contextData: {
                    title: "1981 Midas (1973 EA)",
                    description: `<div>
                    <p> 
                    1981 Midas, provisional designation 1973 EA, is a vestoid asteroid, classified as a near-Earth object and potentially hazardous asteroid, approximately 2 kilometers in diameter.[1]

                    It was discovered on 6 March 1973 by American astronomer Charles Kowal at Palomar Observatory in San Diego County, California.[3] It was named after King Midas from Greek mythology.[2]                        <p>
                        <a href="https://en.wikipedia.org/wiki/1981_Midas">Link to Wikipedia Source</a>
                        </p>
                        `,
                    imageSrc: ""
                }
            },
            "192642 (1999 RD32)": {
                contextData: {
                    title: "192642 (1999 RD32)",
                    description: `<div>
                    <p> 
                    (192642) 1999 RD32, provisional designation: 1999 RD32, is an asteroid and suspected contact binary on an eccentric orbit, classified as a large near-Earth object and potentially hazardous asteroid of the Apollo group, approximately 5 kilometers (3 miles) in diameter. It was discovered on 8 September 1999, at a magnitude of 18, by astronomers of the LINEAR program using its 1-meter telescope at the Lincoln Laboratory's Experimental Test Site near Socorro, New Mexico, United States.[3][2] The asteroid is likely of carbonaceous composition and has a rotation period of 17.08 hours.[4][a]                                    </p>
                        <p>
                        <a href="https://en.wikipedia.org/wiki/(192642)_1999_RD32">Link to Wikipedia Source</a>
                        </p>
                        `,
                    imageSrc: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/1999rd32.jpg/250px-1999rd32.jpg"
                }
            }
        }
        // create a tooltip
        var tooltip = 
        d3.select("#scene2").append("div")
            .attr("id", "tooltip2")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("color", "white")

        // Add brushing
        var brush = d3.brush()                 // Add the brush feature using the d3.brush function
            .extent([[0, 0], [width, height]]) // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
            .on("end", updateChart) // Each time the brush selection changes, trigger the 'updateChart' function
        // * Add dots for each data point
        g.append('g')
            .selectAll("dot")
            .data(data.filter(d => d['Diameter'] > 1000))
            .enter()
            .append("circle")
            .on('mouseover', function (d, i) {
                console.log(d,i)
                d3.select(this).transition()
                    .duration('100')
                    .attr("r", (d => d['Diameter'] / 500.0 * 1.5))
                    tooltip.style("visibility", "visible")
            })
            .on('mouseout', function (d, i) {
                d3.select(this).transition()
                    .duration('200')
                    .attr("r", d => d['Diameter'] / 500.0)
                    tooltip.style("visibility", "hidden")
            })
            .on("mousemove", function(event, d){
               
                scene2.querySelector("#tooltip2").innerHTML = `<div width="500px">
                <h3> ${d['Object']} </h1>
                <p> <i> Approach Date: ${d['Close-Approach (CA) Date']}</i> </p>
                <p> <i> Distance (LD): ${d['CAminDistanceLD']}</i> </p>
                <p> <i> Relative Velocity (km/s): ${d['RelativeVelocity']}</i> </p>
                ${contextMap[d['Object']] != undefined ? `<img src="${contextMap[d['Object']].contextData.imageSrc}" width="100px" />`: ""}
                ${contextMap[d['Object']] != undefined ?  ` <p> <b> Click for more context! </b> </p>`: ""}
                </div>`
                return tooltip.style("top", (event.pageY - 100)+"px" ).style("left",(event.pageX-200)+"px");
            })
            .on('click', function (d, v) {
                if ( contextMap[v['Object']] ) {
                    d3.select(this).transition()
                    .duration('200')
                    .attr("r", d => d['Diameter'] / 500.0)
                    let l = contextMap[v['Object']]
                    console.log(l)
                    let contextTitle = contextScene2.querySelector("#contextTitle2")
                    let contextDescription = contextScene2.querySelector("#contextDescription2")
                    let contextImage = contextScene2.querySelector("#contextImage2")
                    contextTitle.innerText = l.contextData.title
                    contextDescription.innerHTML = l.contextData.description
                    if (l.contextData.imageSrc && l.contextData.imageSrc.length > 0) {
                        contextImage.src = l.contextData.imageSrc
                        contextImage.style.width = "400px"
                        contextImage.style.height = "400px"
                    } else {
                        contextImage.style.width = 0
                        contextImage.style.height = 0
                    }
                    setScene('context2', false)
                    
                }            
            })
            .attr("cx", function (d) { return x(d['RelativeVelocity']); })
            .attr("cy", function (d) { return y(d['CAminDistanceLD']); })
            .attr("r", d => d['Diameter'] / 500.0)
            .attr("opacity", 0.5)
            .style("fill", d => {
                if ( contextMap[d['Object']] ) {
                    return "red"
                }
                return "#fff"
            })
        

        let brushGroup = g
            .append("g")
            .attr("class", "brush")
            // .call(brush);
        // A function that set idleTimeOut to null
        var idleTimeout
        function idled() { idleTimeout = null; }

        // A function that update the chart for given boundaries
        let lastUpdated = Date.now()
        function updateChart(event) {

            extent = event.selection
            // If no selection, back to initial coordinate. Otherwise, update X axis domain
            if (!extent) {
                if (!idleTimeout) return idleTimeout = setTimeout(idled, 350); // This allows to wait a little bit
                x.domain([0, maxV])
                y.domain([0, maxD])
            } else {
                x.domain([x.invert(extent[0][0]), x.invert(extent[1][0])])
                y.domain([y.invert(extent[1][1]), y.invert(extent[0][1])])
                g.select(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done
            }

            // Update axis and circle position
            xAxis.transition().duration(1000).call(d3.axisBottom(x))
            yAxis.transition().duration(1000).call(d3.axisLeft(y))

            g
                .selectAll("circle")
                .transition().duration(1000)
                .attr("cx", function (d) { return x(d['RelativeVelocity']); })
                .attr("cy", function (d) { return y(d['CAminDistanceLD']); })
                .attr("r", d => d['Diameter'] / 500.0)

            lastUpdated = Date.now()


        }
        // setTimeout(() => {
        //     brushGroup.call(brush.clear)
        //     updateChart({ selection: null })
        // }, 5000)
    }

    const scene3 = createScene("scene3")
    scene3.appendChild(stringToHTML(`<div width="100%" height="100%">
   <h1>Our understanding of Space is constantly improving</h1>
   <p> As technology advances we are able to observe more near earth objects and predict their trajectory. This is pivotal in
   identifying any potential existential risks to our planet in the event of an asteroid coming our way. This can allow us to plan
   for mediation, or know how much time until an apocalytpic event. Overall, as technology improves, the number of near earth objects
   we can observe & predict will increase. </p>
    <img src="https://media.wired.com/photos/5b52582f59269e342890a45a/master/pass/Satellite_FHM56J.jpg" width="600px" height="400px"/>
    <p> <b> Thankyou for visiting this visualization delving deep into Near Earth objects & their characteristics! :) </b> </p>

   </div>`
   ))

}

main().then(() => {
    setScene("intro")
})