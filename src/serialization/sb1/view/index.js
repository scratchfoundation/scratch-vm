const {SB1View} = require('./view');

SB1View.register(require('./array').ArrayRenderer);
SB1View.register(require('./field-object').FieldObjectRenderer);
SB1View.register(require('./field').FieldRenderer);
SB1View.register(require('./js-primitive').JSPrimitiveRenderer);
SB1View.register(require('./object').ObjectRenderer);
SB1View.register(require('./viewable').ViewableRenderer);

exports.SB1View = SB1View;
