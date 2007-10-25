 
// Use existing freebase namespace
// if it exists
if (typeof window.freebase == "undefined")
    window.freebase = {};

if (typeof window.freebase.controls != "undefined")
    window.freebase._controls = window.freebase.controls;

window.freebase.controls = {};

(function($, fb) {

