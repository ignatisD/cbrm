import IMapping, { IMappingProperty } from "../interfaces/helpers/Mapping";

/**
 * Generate mapping
 * @param {Object} schema - mongoose schema
 * @returns {Object}
 */
function generate(schema): IMapping {
    const mapping: IMapping = {};
    const typeKey = getTypeKey(schema);
    const defaultTypes = getDefault();

    Object.keys(schema.paths).forEach(name => {
        // ignore _id because is used as index
        if (name === "_id") {
            return;
        }

        const path = schema.paths[name];
        const type = getType(path);
        const enums = getEnum(path);
        const opts = getOptions(path, typeKey);
        const options = opts.options;

        let current: IMappingProperty|IMapping = mapping;
        const names = name.split(".");

        // ignore map fields
        if (names.includes("$*")) {
            return;
        }

        // handle plain object
        if (names.length > 1) {
            names.forEach((name, index) => {
                if (index === names.length - 1) {
                    // last item is the target
                    current = current[name] = {type};
                } else {
                    if (!current[name]) {
                        current[name] = {type: "object", properties: {}, intl: false};
                    }
                    current = current[name].properties;
                }
            });
            if (names[names.length - 1] === "en") {
                mapping[names[0]].intl = true;
            }
        } else {
            current = mapping[name] = {type};
            if (path.instance === "Array") {
                current.array = true;
            } else if (path.instance === "Map") {
                current.map = path["$__schemaType"].instance?.toLowerCase();
            }
            if (path.approval === true) {
                current.approval = true;
            }
            if (enums.length) {
                current.enum = enums;
            }
        }

        if (isEmbedded(type)) {
            current.type = "object";
            current.properties = generate(path.schema);
        }
        if (defaultTypes[type]) {
            current.type = defaultTypes[type];
            if (defaultTypes[type] === "model") {
                current.ref = options.ref;
            }
        }
        if (opts.array) {
            current.array = true;
        }
        if (opts.approval) {
            current.approval = true;
        }
    });

    delete mapping[schema.get("versionKey")];
    return mapping;
}

/**
 * Check if the type is embedded
 * @param type
 * @returns {boolean}
 */
function isEmbedded(type) {
    return type === "embedded" || type === "array"; // || type === "mixed";
}

/**
 * Get the type's key
 * @param schema
 * @returns {string}
 */
function getTypeKey(schema) {
    return schema.options.typeKey || "type";
}
/**
 * Generate mapping
 * @param {Object} path - mongoose path
 * @param {string} typeKey - mongoose type key (string)
 * @returns {Object}
 */
function getOptions(path, typeKey: string) {
    const result = {
        approval: !!path.options.approval,
        array: false,
        options: path.options
    };
    if (
        Array.isArray(path.options[typeKey]) &&
        path.options[typeKey].length === 1
    ) {
        result.approval = !!path.options[typeKey][0].approval;
        if (path.options[typeKey][0].ref) {
            result.array = true;
            result.options = path.options[typeKey][0];
        }
    }
    return result;
}

/**
 * Return the Type of a schema path
 * @param {object} path
 * @return {string}
 */
function getType(path) {
    return (path.caster && path.caster.instance
        ? path.caster.instance
        : path.instance
    ).toLowerCase();
}
/**
 * Return the Enums of a schema path if any
 * @param {object} path
 * @return {string}
 */
function getEnum(path) {
    return (path.caster && path.caster.enumValues
        ? path.caster.enumValues
        : []
    );
}

/**
 * Return default type mapping
 * @return {object}
 */
function getDefault() {
    return {
        objectid: "model",
        number: "number",
        mixed: "object",
        string: "string",
    };
}

export default generate;
