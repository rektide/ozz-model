#!/usr/bin/env node
"use strict"

var
  _promisify= require("es6-promisify"),
  fs= require( "fs"),
  ndjson= require("ndjson")

var
  readFile= _promisify( fs.readFile)

function transformElement( el, prefix){
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
		el.timestamp
	].join("")
	console.log("output", results)
	return results
}

function promOzz({source, dest}){
	if(typeof source == "string"){
		source= fs.createReadStream( source, "utf8")
	}
	var
	  read= source.pipe( ndjson.parse()),
	  write= fs.createWriteStream( dest, {flags: "a"})
	write.setDefaultEncoding("utf8")
	read.on("data", function(d){
		var entry= transformElement( d)
		if(!entry){
			return
		}
		write.write( entry)
	})
}

function main(){
	var
	  source= process.stdin.isTTY? process.argv[3]: process.stdin,
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
