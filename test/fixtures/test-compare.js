const testCompare = (t, lhs, op, rhs, message) => {
    const details = `Expected: ${lhs} ${op} ${rhs}`;
    const extra = {details};
    switch (op) {
    case '<': return t.ok(lhs < rhs, message, extra);
    case '<=': return t.ok(lhs <= rhs, message, extra);
    case '===': return t.ok(lhs === rhs, message, extra);
    case '!==': return t.ok(lhs !== rhs, message, extra);
    case '>=': return t.ok(lhs >= rhs, message, extra);
    case '>': return t.ok(lhs > rhs, message, extra);
    default: return t.fail(`Unrecognized op: ${op}`);
    }
};

module.exports = testCompare;
