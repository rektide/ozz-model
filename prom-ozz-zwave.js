#!/usr/bin/env node
"use strict"

var
  _promisify= require("es6-promisify"),
  fs= require( "fs"),
  memoizee= require( "memoizee"),
  metrics= require( "prom-pb-client"),
  ndjson= require("ndjson"),
  server= require( "prom-pb-client/server")

var
  readFile= _promisify( fs.readFile)

/**
 * Generate a metrics reading
 */
function factory(){
	var klass= {}
	var metrics= {}
	for(var i in node){
		var n= node[i]
		if(!n){
			continue
		}
		var k= klassStore(n.classId)
		klass[n.classId]= k
		var m= metrics[n.classId]|| (metrics[n.classId]= [])
		for(var j in n.instance){
			var ins= n.instance[i]
			if(!ins){
				continue
			}
			for(var k in ins.index){
				m.push( metricStore(i))
			}
		}
	}
}

function transformPrommetheusNodeExporterTextfile( el, prefix){
	if( el.eventType!== "changed"&& el.eventCategory!== "value"){
		return ""
	}
	var value= parseFloat( el.value)
	if( !value){
		return ""
	}
	var results= [
		prefix|| "",
		prefix? "_": "",
		el.label.toLowerCase(),
		el.units? "_": "",
		el.units|| "",
		"{node=",
		el.nodeId,
		", index=",
		el.index,
		"} ",
		el.value,
		" ",
		el.timestamp,
		"\n"
	].join("")
	return results
}

var nodeNames= {}
var metrics= memoizee(function( nodeId, classId, instanceId, index){
})
var family= memoizee(function( nodeId, classId, instanceId, index){
	var
	  prefix= "ozz_",
	  name= names[nodeId][classId][instanceId][index],
	  attr,
	  prop= prefix+ name + "_" + ""
	  help= ""

	var family= new metrics.MetricFamily( prop, help, metrics.MetricType.GAUGE, [])
	var metric = new metrics.Metric(new metrics.LabelPair( "path", path), new metrics.Gauge( 0), null, null, null, null, null)
	family.metric= metric
	return family
})

function promOzz({source, dest}){
	if(typeof source == "string"){
		source= fs.createReadStream( source, "utf8")
	}
	var
	  read= source.pipe( ndjson.parse()),
	  write= fs.createWriteStream( dest, {flags: "a"})
	write.setDefaultEncoding("utf8")
	read.on("data", function(d){
		var entry= transformPrometheusNodeExporterTextfile( d)
		if(!entry){
			return
		}
		write.write( entry)
	})
}

var node= []
var value= {}
var name= {}
var klass= {}

/*
 *  Addressing
 *  `classId` specifies/targets a kind of device (ex: light) and `index` specifies/targets something specific on that given device
 *  `nodeId` specifies an individual device on your network (ex: dimmers) and `instance` specifies the which copy of the submodule you want on the d
 *ice (ex: a double switch, or a sockets on a powerstrip)
 *
 *  Order of addresses:
 *  [nodeId]-[classId]-[instance]-[index]
 */

/**
 * Node becomes "available" once basic facts are known
 * @example
 * {"eventType":"available","eventCategory":"node","timestamp":1475822994330,"nodeId":1,"manufacturer":"Aeotec","manufacturerId":"0x0086",
 * "product":"ZW090 Z-Stick Gen5","productType":"0x0101","productId":"0x005a","type":"Static PC Controller","name":"","loc":""}
 */
function available(o){
	nodes[o.nodeId]= o
	if(o.name){
		name[o.name]= o
	}
	o.instance= []
}

/**
 * Property is "added" to a node
 * @example
 * {"eventType":"added","eventCategory":"value","timestamp":1475823000908,"nodeId":3,"classId":37,"valueId":"3-37-1-0","type":"bool","genre":"user",
 *"instance":1,"index":0,"label":"Switch","units":"","help":"","readOnly":false,"writeOnly":false,"isPolled":false,"min":0,"max":0,"value":false}
 * {"eventType":"added","eventCategory":"value","timestamp":1475823014264,"nodeId":3,"classId":50,"valueId":"3-50-1-0","type":"decimal","genre":"user",
 *"instance":1,"index":0,"label":"Unknown","units":"","help":"","readOnly":true,"writeOnly":false,"isPolled":false,"min":0,"max":0,"value":"0.0"}
 */
function added(o){
	var node= nodes[o.nodeId]
	node.instance[o.instance]= o
	o.index= []
}

/**
 * Property value "changed" on a node
 * @example
 * {"eventType":"changed","eventCategory":"value","timestamp":1477028524203,"nodeId":5,"classId":50,"valueId":"5-50-3-8","type":"decimal","genre":"user",
 *"instance":3,"index":8,"label":"Power","units":"W","help":"","readOnly":true,"writeOnly":false,"isPolled":false,"min":0,"max":0,"value":"19.476"}
 */
function changed(o){
	node[o.nodeId].instance[o.instance].index[o.index]= o
	value[o.valueId]= o
}

function lookup(nodeId, instanceId, indexId){
	var result= []
	if(nodeId){
		var node= node[nodeId]
		result.unshift(node)
		if(instanceId){
			var instance= node.instance[instanceId]
			result.unshift(instance)
			if(indexId){
				var index= instance.index[indexId]
				result.unshift(index)
			}
		}
	}
	return result
}

function main(){
	var
	  source= process.stdin.isTTY? fs.createReadStream(process.argv[3]{encoding:"utf8"): process.stdin,
	  dest= process.argv[2]
	if(!source){
		console.log("no source", process.stdin.isTTY)
		process.exit(2)
	}else if(!dest){
		console.log("no dest")
		process.exit(2)
	}
	return promOzz({source, dest})
}

if( require.main=== module){
	main()
}

module.exports= promOzz
module.exports.promOzz= promOzz
module.exports.main= main
module.exports.lookup= lookup

module.exports.available= available
module.exports.added= added
module.exports.changed= changed
