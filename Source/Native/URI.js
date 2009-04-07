/*
Script: URI.js
	Provides methods useful in managing the window location and uris.

	License:
		MIT-style license.

	Authors:
		Sebastian Markb�ge, Aaron Newton
*/

var URI = new Class({

	Implements: Options,
	
	/*
	options: {
		base: false
	},
	*/

	regex: /^(?:(\w+):)?(?:\/\/(?:(?:([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?)?(\.\.?$|(?:[^?#\/]*\/)*)([^?#]*)(?:\?([^#]*))?(?:#(.*))?/,
	parts: ['scheme', 'user', 'password', 'host', 'port', 'directory', 'file', 'query', 'fragment'],
	schemes: { http: 80, https: 443, ftp: 21, rtsp: 554, mms: 1755, file: undefined },

	initialize: function(uri, options){
		this.setOptions(options);
		var base = this.options.base || URI.base;
		uri = uri || base;
		if (uri && uri.parsed){
			this.parsed = uri.parsed;
			return;
		}
		this.set('value', uri.href || uri.toString(), base ? new URI(base) : false);
	},
	
	parse: function(value, base){
		var bits = value.match(this.regex);
		if (!bits) return false;
		bits.shift()
		bits = bits.associate(this.parts);
		return this.merge(bits, base);
	},
	
	merge: function(bits, base){
		if (base){
			this.parts.every(function(part){
				if (bits[part]) return false;
				bits[part] = base[part] || '';
				return true;
			});
		}
		
		if (!bits.scheme) return false;

		bits.port = bits.port || this.schemes[bits.scheme];
	
		if (bits.directory){
			var directory = ((/^\/.?/.test(bits.directory)) ? '' :
							(base && base.directory ? base.directory : '/')) +
							bits.directory;

			var result = [];
			directory.replace(/\/$/, '').split('/').each(function(dir){
				if (dir == '..' && result.length > 0)
					result.pop();
				else if (dir != '.')
					result.push(dir);
			});
			bits.directory = result.join('/') + '/';
		}

		return bits;
	},

	combine: function(bits){
		return bits.value || bits.scheme + '://' +
			(bits.user ? bits.user + (bits.password ? ':' + bits.password : '') + '@' : '') +
			(bits.host || '') + (bits.port && bits.port != this.schemes[bits.scheme] ? ':' + bits.port : '') +
			(bits.directory || '/') + (bits.file || '') +
			(bits.query ? '?' + bits.query : '') +
			(bits.fragment ? '#' + bits.fragment : '');
	},

	set: function(part, value, base){
		if (part == 'value'){
			var scheme = value.match(/^(\w+):/);
			if (scheme && !Hash.has(this.schemes, scheme[1].toLowerCase())){
				this.parsed = { scheme: scheme[1], value: value };
			} else {
				var bits = this.parse(value, (base || this).parsed);
				this.parsed = bits || (scheme ? { scheme: scheme[1], value: value } : { value: value });
			}
		} else {
			this.parsed[part] = value;
		}
		return this;
	},

	get: function(part, base){
		if (part == 'value') return this.combine(this.parsed, base ? base.parsed : false);
		return this.parsed[part] || undefined;
	},

	go: function(){
		document.location.href = this.toString();
	},
	
	toURI: function(){
		return this;
	}

});

URI.prototype.toString = function(){
	return this.get('value');
};

URI.base = new URI($$('base[href]').getLast(), { base: document.location });

String.implement({

	toURI: function(options){ return new URI(this, options); }

});