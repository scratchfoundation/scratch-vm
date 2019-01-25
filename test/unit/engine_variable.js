const test = require('tap').test;
const Variable = require('../../src/engine/variable');
const htmlparser = require('htmlparser2');

test('spec', t => {
    t.type(typeof Variable.SCALAR_TYPE, typeof Variable.LIST_TYPE);
    t.type(typeof Variable.SCALAR_TYPE, typeof Variable.BROADCAST_MESSAGE_TYPE);

    const varId = 'varId';
    const varName = 'varName';
    const varIsCloud = false;
    let v = new Variable(
        varId,
        varName,
        Variable.SCALAR_TYPE,
        varIsCloud
    );

    t.type(Variable, 'function');
    t.type(v, 'object');
    t.ok(v instanceof Variable);

    t.equal(v.id, varId);
    t.equal(v.name, varName);
    t.equal(v.type, Variable.SCALAR_TYPE);
    t.type(v.value, 'number');
    t.equal(v.isCloud, varIsCloud);

    t.type(v.toXML, 'function');

    v = new Variable(
        varId,
        varName,
        Variable.LIST_TYPE,
        varIsCloud
    );
    t.ok(Array.isArray(v.value));

    v = new Variable(
        varId,
        varName,
        Variable.BROADCAST_MESSAGE_TYPE,
        varIsCloud
    );
    t.equal(v.value, 'varName');

    t.end();
});

test('toXML', t => {
    const varId = 'varId';
    const varName = 'varName';
    const varIsCloud = false;
    const varIsLocal = false;
    const v = new Variable(
        varId,
        varName,
        Variable.SCALAR_TYPE,
        varIsCloud
    );

    const parser = new htmlparser.Parser({
        onopentag: function (name, attribs){
            if (name === 'variable'){
                t.equal(attribs.type, Variable.SCALAR_TYPE);
                t.equal(attribs.id, varId);
                t.equal(attribs.iscloud, varIsCloud.toString());
                t.equal(attribs.islocal, varIsLocal.toString());
            }
        },
        ontext: function (text){
            t.equal(text, varName);
        }
    }, {decodeEntities: false});
    parser.write(v.toXML(false));
    parser.end();

    t.end();
});

test('escape variable name for XML', t => {
    const varId = 'varId';
    const varName = '<>&\'"';
    const varIsCloud = false;
    const varIsLocal = false;
    const v = new Variable(
        varId,
        varName,
        Variable.SCALAR_TYPE,
        varIsCloud
    );

    const parser = new htmlparser.Parser({
        onopentag: function (name, attribs){
            if (name === 'variable'){
                t.equal(attribs.type, Variable.SCALAR_TYPE);
                t.equal(attribs.id, varId);
                t.equal(attribs.iscloud, varIsCloud.toString());
                t.equal(attribs.islocal, varIsLocal.toString());
            }
        },
        ontext: function (text){
            t.equal(text, '&lt;&gt;&amp;&apos;&quot;');
        }
    }, {decodeEntities: false});
    parser.write(v.toXML(false));
    parser.end();

    t.end();
});
