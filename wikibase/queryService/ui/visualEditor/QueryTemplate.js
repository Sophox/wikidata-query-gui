var wikibase = wikibase || {};
wikibase.queryService = wikibase.queryService || {};
wikibase.queryService.ui = wikibase.queryService.ui || {};
wikibase.queryService.ui.visualEditor = wikibase.queryService.ui.visualEditor || {};

wikibase.queryService.ui.visualEditor.QueryTemplate = ( function( $, wikibase ) {
	'use strict';

	/**
	 * A template for a SPARQL query
	 *
	 * @class wikibase.queryService.ui.visualEditor.QueryTemplate
	 * @license GNU GPL v2+
	 *
	 * @author Lucas Werkmeister
	 * @constructor
	 */
	function SELF() {
	}

	/**
	 * @property {Object} The parsed template definition.
	 * @private
	 */
	SELF.prototype._definition = {};

	/**
	 * @property {jQuery} A span with the rendered template.
	 * @private
	 */
	SELF.prototype._template = null;

	/**
	 * @property {Object.<string, Array.<jQuery>>} A map from variable names to lists of spans corresponding to that variable.
	 * @private
	 */
	SELF.prototype._variables = [];

	/**
	 * @param {SparqlQuery} query
	 * @return {?QueryTemplate}
	 */
	SELF.parse = function( query ) {
		var templateComment = query.getCommentContent( 'TEMPLATE=' ),
			templateJson,
			template;

		if ( !templateComment ) {
			return null;
		}
		try {
			templateJson = JSON.parse( templateComment );
		} catch ( e ) {
			return null;
		}

		template = new SELF;
		template._definition = templateJson;
		template._fragments = SELF._getQueryTemplateFragments( templateJson );

		return template;
	};

	/**
	 * Splits the template 'a ?b c ?d e' into
	 * [ 'a ', '?b', ' c ', '?d', ' e' ].
	 * Text and variable fragments always alternate,
	 * and the first and last fragment are always text fragments
	 * ('' if the template begins or ends in a variable).
	 *
	 * @param {{template: string, variables: string[]}} definition
	 * @return {string[]}
	 */
	SELF._getQueryTemplateFragments = function( definition ) {
		if ( definition.template.match( /\0/ ) ) {
			throw new Error( 'query template must not contain null bytes' );
		}
		var fragments = [ definition.template ],
			variable,
			newFragments;

		function splitFragment( fragment ) {
			var textFragments = fragment
				.replace( new RegExp( '\\' + variable, 'g' ), '\0' )
				.split( '\0' );
			newFragments.push( textFragments[0] );
			for ( var i = 1; i < textFragments.length; i++ ) {
				newFragments.push( variable );
				newFragments.push( textFragments[ i ] );
			}
		}

		for ( variable in definition.variables ) {
			if ( !variable.match( /\?[a-z][a-z0-9]*/i ) ) {
				// TODO this is more restrictive than SPARQL;
				// see https://www.w3.org/TR/sparql11-query/#rVARNAME
				throw new Error( 'invalid variable name in query template' );
			}
			newFragments = [];
			fragments.forEach( splitFragment );
			fragments = newFragments;
		}

		return fragments;
	};

	/**
	 * Assemble the template span out of the fragments.
	 *
	 * @param {string[]} fragments The template fragments (see {@link _getQueryTemplateFragments}).
	 * @param {Object.<string, jQuery>} variables The individual variables are stored in this object, indexed by variable name.
	 * @return {jQuery}
	 */
	SELF._buildTemplate = function( fragments, variables ) {
		var template = $( '<span>' );

		template.append( document.createTextNode( fragments[ 0 ] ) );
		for ( var i = 1; i < fragments.length; i += 2 ) {
			var variable = fragments[ i ],
				$variable = $( '<span>' ).text( variable );
			if ( !( variable in variables ) ) {
				variables[variable] = [];
			}
			variables[variable].push( $variable );
			template.append( $variable );
			template.append( document.createTextNode( fragments[ i + 1 ] ) );
		}

		return template;
	};

	/**
	 * @param {Function} getLabel Called with {string} variable name, should return {Promise} for label, id, description, type.
	 * @param {wikibase.queryService.ui.visualEditor.SelectorBox} selectorBox
	 * @param {Function} changeListener Called with {string} variable name, {string} old value, {string} new value.
	 * @return {jQuery}
	 */
	SELF.prototype.getHtml = function( getLabel, selectorBox, changeListener ) {
		if ( this._template !== null ) {
			return this._template;
		}

		this._template = SELF._buildTemplate( this._fragments, this._variables );

		var self = this;

		$.each( this._definition.variables, function( variable, variableDefinition ) {
			getLabel( variable ).done( function( label, id, description, type ) {
				$.each( self._variables[ variable ], function( index, $variable ) {
					$variable.text( '' );
					var $link = $( '<a>' ).text( label ).attr( {
						'data-id': id,
						'data-type': type,
						href: '#'
					} ).appendTo( $variable );

					if ( variableDefinition.query ) {
						$link.attr( 'data-sparql', variableDefinition.query );
					}

					selectorBox.add( $link, null, function( selectedId, name ) {
						for ( var j in self._variables[ variable ] ) {
							var $variable = self._variables[ variable ][ j ];
							$variable.find( 'a[data-id="' + id + '"]' )
								.attr( 'data-id', selectedId )
								.text( name );
							changeListener( variable, id, selectedId );
							id = selectedId;
						}
					} );
				} );
			} );
		} );

		return this._template;
	};

	return SELF;
}( jQuery, wikibase ) );