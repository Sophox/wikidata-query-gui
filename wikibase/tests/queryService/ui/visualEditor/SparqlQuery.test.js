( function( $, QUnit, sinon, wb ) {
	'use strict';

	QUnit.module( 'wikibase.queryService.ui.visualEditor' );

	var PACKAGE = wb.queryService.ui.visualEditor;
	var QUERY = {
		SIMPLE: 'SELECT * WHERE {}',
		LIMIT: 'SELECT * WHERE {} LIMIT 10',
		VARIABLES: 'SELECT ?x1 ?x2 ?x3 WHERE {} LIMIT 10',
		TRIPLES_UNION: 'SELECT ?x1 ?x2 ?x3 WHERE { <S> <P> <O>.  OPTIONAL{ <S1> <P1> <O1> }  <S2> <P2> <O2>. { <SU1> <PU1> <OU1> } UNION { <SU2> <PU2> <OU2> } }',
		TRIPLES: 'SELECT ?x1 ?x2 ?x3 WHERE { <S> <P> <O>.  OPTIONAL{ <S1> <P1> <O1> }  <S2> <P2> <O2>.}',
		SUBQUERIES: 'SELECT * WHERE {  {SELECT * WHERE { {SELECT * WHERE {}} }} }',
		BOUND: 'SELECT * WHERE { ?bound <P> <O>.  OPTIONAL{ <S1> ?x ?bound2 }  <S2> <P2> <O2>.}',
	};

	QUnit.test( 'When instantiating new SparqlQuery then', function( assert ) {
		assert.expect( 2 );
		var q = new PACKAGE.SparqlQuery();

		assert.ok( true, 'must not throw an error' );
		assert.ok( ( q instanceof PACKAGE.SparqlQuery ), 'object must be type of SparqlQuery' );
	} );

	QUnit.test( 'When parsing query is \'' + QUERY.SIMPLE + '\' then', function( assert ) {
		assert.expect( 1 );

		var q = new PACKAGE.SparqlQuery();
		q.parse( QUERY.SIMPLE );
		q.getQueryString();

		assert.ok( true, 'parsing must not throw an error' );
	} );

	QUnit.test( 'When parsing query ' + QUERY.LIMIT, function( assert ) {
		assert.expect( 1 );

		var q = new PACKAGE.SparqlQuery();
		q.parse( QUERY.LIMIT );
		var limit = q.getLimit();

		assert.equal( 10, limit, 'then LIMIT must be 10' );
	} );

	QUnit.test( 'When query is \'' + QUERY.LIMIT + '\' and I change LIMIT to LIMIT * 2 then',
			function( assert ) {
				assert.expect( 1 );

				var q = new PACKAGE.SparqlQuery();
				q.parse( QUERY.LIMIT );
				var limit = q.getLimit();
				q.setLimit( ( limit * 2 ) );

				assert.equal( 20, q.getLimit(), 'LIMIT must be 20' );
			} );

	QUnit.test( 'When query is \'' + QUERY.LIMIT + '\' and I set LIMIT to NULL then', function(
			assert ) {
		assert.expect( 2 );

		var q = new PACKAGE.SparqlQuery();
		q.parse( QUERY.LIMIT );
		q.setLimit( null );

		assert.equal( null, q.getLimit(), 'LIMIT should be NULL' );
		assert.equal( 'SELECT * WHERE {  }', q.getQueryString(),
				'query string should not contain LIMIT ' );
	} );

	QUnit.test( 'When query is \'' + QUERY.VARIABLES + '\' then', function( assert ) {
		assert.expect( 5 );

		var q = new PACKAGE.SparqlQuery();
		q.parse( QUERY.VARIABLES );

		assert.ok( q.hasVariable( '?x1' ), '?x1 must be a variable' );
		assert.ok( q.hasVariable( '?x2' ), '?x1 must be a variable' );
		assert.ok( q.hasVariable( '?x3' ), '?x1 must be a variable' );

		assert.notOk( q.hasVariable( 'x4' ), 'x1 must not be a variable' );
		assert.notOk( q.hasVariable( '?x4' ), '?x1 must not be a variable' );
	} );


	QUnit.test( 'When query is \'' + QUERY.VARIABLES + '\' and I delete ?x2 then', function( assert ) {
		assert.expect( 4 );

		var q = new PACKAGE.SparqlQuery();
		q.parse( QUERY.VARIABLES );
		q.removeVariable( '?x2' );

		assert.ok( q.hasVariable( '?x1' ), '?x1 must be a variable' );
		assert.ok( q.hasVariable( '?x3' ), '?x3 must be a variable' );

		assert.notOk( q.hasVariable( 'x4' ), 'x1 must not be a variable' );
		assert.notOk( q.hasVariable( '?x2' ), '?x1 must not be a variable' );
	} );

	QUnit.test( 'When query is \'' + QUERY.SIMPLE + '\' THEN', function( assert ) {
		assert.expect( 6 );

		var q = new PACKAGE.SparqlQuery();
		q.parse( QUERY.SIMPLE );

		assert.ok( q.hasVariable( '?XX' ), '?XX must be a variable' );
		assert.ok( q.hasVariable( '?YYY' ), '?YYY must be a variable' );
		assert.ok( q.hasVariable( '?ZZLABEL' ), '?ZZLABEL must be a variable' );
		assert.notOk( q.hasVariable( 'XX' ), 'XX must not be a variable' );
		assert.notOk( q.hasVariable( 'YY' ), 'XX must not be a variable' );
		assert.notOk( q.hasVariable( 'ZZ' ), 'XX must not be a variable' );
	} );

	QUnit.test( 'When query is \'' + QUERY.TRIPLES_UNION + '\' then', function( assert ) {
		assert.expect( 16 );

		var q = new PACKAGE.SparqlQuery();
		q.parse( QUERY.TRIPLES_UNION );
		var triples = q.getTriples();

		assert.equal( triples.length, 5, 'there should be 5 triples' );

		assert.equal( triples[0].optional, false, 'triple0 must not be optional' );
		assert.deepEqual( triples[0].query, q, 'query of triple1 must be query' );
		assert.deepEqual( triples[0].triple, {
			"subject": "S",
			"predicate": "P",
			"object": "O"
		}, 'tripl1 must be S, P, O' );

		assert.equal( triples[1].optional, true, 'triple1 must be optional' );
		assert.deepEqual( triples[1].query, q, 'query of triple1 must be query' );
		assert.deepEqual( triples[1].triple, {
			"object": "O1",
			"predicate": "P1",
			"subject": "S1"
		}, 'tripl1 must be S1, P1, O1' );

		assert.equal( triples[2].optional, false, 'triple2 must not be optional' );
		assert.deepEqual( triples[2].query, q, 'query of triple1 must be query' );
		assert.deepEqual( triples[2].triple, {
			"object": "O2",
			"predicate": "P2",
			"subject": "S2"
		}, 'tripl2 must be S2, P2, O2' );


		assert.equal( triples[3].optional, false, 'triple3 must not be optional' );
		assert.deepEqual( triples[3].query, q, 'query of triple3 must be query' );
		assert.deepEqual( triples[3].triple, {
			"subject": "SU1",
			"predicate": "PU1",
			"object": "OU1"
		}, 'triple3 must be SU1, PU1, OU1' );

		assert.equal( triples[4].optional, false, 'triple3 must not be optional' );
		assert.deepEqual( triples[4].query, q, 'query of triple3 must be query' );
		assert.deepEqual( triples[4].triple, {
			"subject": "SU2",
			"predicate": "PU2",
			"object": "OU2"
		}, 'triple3 must be SU2, PU2, OU2' );
	} );

	QUnit.test( 'When query is \'' + QUERY.TRIPLES + '\' and I delete 2 triples then', function(
			assert ) {
		assert.expect( 2 );

		var q = new PACKAGE.SparqlQuery();
		q.parse( QUERY.TRIPLES );
		var triples = q.getTriples();

		triples[0].remove();
		triples[2].remove();

		triples = q.getTriples();

		assert.equal( triples.length, 1, 'there should be 1 triple left' );
		assert.deepEqual( triples[0].triple, {
			"object": "O1",
			"predicate": "P1",
			"subject": "S1"
		}, 'tripl left must be S1, P1, O1' );
	} );

	QUnit.test( 'When query is \'' + QUERY.SUBQUERIES + '\' then', function( assert ) {
		assert.expect( 4 );

		var q = new PACKAGE.SparqlQuery();
		q.parse( QUERY.SUBQUERIES );
		var queries = q.getSubQueries();

		assert.equal( queries.length, 1, 'expecting one subquery' );
		assert.ok( ( queries[0] instanceof PACKAGE.SparqlQuery ),
				'that must be instance of SparqlQuery' );

		queries = queries[0].getSubQueries();
		assert.equal( queries.length, 1, 'expecting one sub query of sub query' );
		assert.ok( ( queries[0] instanceof PACKAGE.SparqlQuery ),
				'that must be instance of SparqlQuery' );
	} );

	QUnit.test( 'When query is \'' + QUERY.TRIPLES + '\' and I add two triples',
			function( assert ) {
				assert.expect( 5 );

				var q = new PACKAGE.SparqlQuery();
				q.parse( QUERY.TRIPLES );

				q.addTriple( 'SX', 'PX', 'OX' );
				q.addTriple( 'SY', 'PY', 'OY', true );

				var triples = q.getTriples();

				assert.equal( triples.length, 5, 'there should be 5 triple ' );

				assert.deepEqual( triples[3].triple, {
					"object": "OX",
					"predicate": "PX",
					"subject": "SX"
				}, 'triple added must be SX, PX, OX' );
				assert.notOk( triples[3].optional, 'triple must not be optional' );

				assert.deepEqual( triples[4].triple, {
					"object": "OY",
					"predicate": "PY",
					"subject": "SY"
				}, 'triple added must be SY, PY, OY' );
				assert.ok( triples[4].optional, 'triple must  be optional' );
			} );

	QUnit.test( 'When query is \'' + QUERY.BOUND + '\'', function( assert ) {
		assert.expect( 1 );

		var q = new PACKAGE.SparqlQuery();
		q.parse( QUERY.BOUND );

		assert.deepEqual( q.getBoundVariables(), [
				"?bound", "?bound2"
		], 'bound subject variables must be ?bound and ?bound2' );
	} );

}( jQuery, QUnit, sinon, wikibase ) );
