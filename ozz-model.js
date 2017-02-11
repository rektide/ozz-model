#!/usr/bin/env node
"use strict"

var
  _promisify= require("es6-promisify"),
  fs= require( "fs"),
  memoizee= require( "memoizee"),
  ndjson= require("ndjson")

class OzzModel{

	constructor( ozzwave, options){
		
	}

	//var node= []
	//var value= {}
	//var name= {}
	//var klass= {}

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
	onnodeavailable( o){
		this.nodes[ o.nodeId]= o
		if( o.name){
			name[ o.name]= o
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
	onnodeadded( o){
		var node= this.nodes[ o.nodeId]
		node.instance[ o.instance]= o
		o.index= []
	}
	
	/**
	 * Property value "changed" on a node
	 * @example
	 * {"eventType":"changed","eventCategory":"value","timestamp":1477028524203,"nodeId":5,"classId":50,"valueId":"5-50-3-8","type":"decimal","genre":"user",
	 *"instance":3,"index":8,"label":"Power","units":"W","help":"","readOnly":true,"writeOnly":false,"isPolled":false,"min":0,"max":0,"value":"19.476"}
	 */
	onvaluechanged( o){
		this.node[ o.nodeId].instance[ o.instance].index[ o.index]= o
		value[ o.valueId]= o
	}
	
	lookup( nodeId, instanceId, indexId){
		var result= []
		if( nodeId){
			var node= this.node[nodeId]
			result.unshift(node)
			if( instanceId){
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
}

function main( options){
	var source= options&& options.source
	if( source=== "-"|| source=== undefined){
		source= process.stdin
	}
	if( typeof( source)=== "string"){
		source= fs.createReadStream( source, { encoding: "utf8"}).pipe( ndjson())
	}
	return new OzzModel({source})
}

if( require.main=== module){
	main()
}

module.exports= OzzModel
module.exports.OzzModel= OzzModel
module.exports.main= main