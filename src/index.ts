type valueType = string | Array<valueType> | Object


var Add = function (key:string, value:valueType) {
    this.schema[key] = value;
    return this;
};

var Remove = function (key:string) {
    delete this.schema[key];
    return this;
};

interface casting<T extends Record<string,any>> {
    schema: Record<string,valueType>,
    key: string,
    object: T
}
var casting = function <T extends Record<string,any>,K extends string | number>(schema:Record<K,valueType>,key:K,object:T) {
    var split:string[];
    var value:any;
    const targetSchema = schema[key] as Record<string,valueType>
    if(typeof targetSchema === "string"){
        if(targetSchema[0]==="$"){
            value = (targetSchema as string).substring(1);
            return value
        }
        else{
            split = (targetSchema as string).split('.');
            value = object[split[0]];
        }
    }
    else{
        var response
        if(typeof targetSchema === "object"){
            if(Array.isArray(targetSchema)){
                response = targetSchema.map((_,key) => casting(targetSchema,key,object))
            }
            else{
                response = Object.entries(targetSchema).reduce((a,v) => {
                    const key = v[0]
                    a[key] = casting(targetSchema,key,object)
                    return a
                },{})
            }
        }
        else{
            if(typeof targetSchema === "function"){
                throw new Error('comming soon!!! function type');
            }
            else{
                throw new Error(`not support!!! ${targetSchema} is ${typeof targetSchema} `);
            }
        }
        if(response){
            return response
        }
    }


    
    var breadcrumbs = split[0];

    if (!value && split.length > 1) {
        throw new Error('Malformed object, missing attribute "' +
            breadcrumbs + '" when trying to get attribute ' +
            breadcrumbs + '[' + split[1] + ']');
    }

    for (var i = 1; i < split.length; i++) {
        breadcrumbs += '[' + split[i] + ']';
        if (!value[split[i]] && i + 1 !== split.length) {
            throw new Error('Malformed object, missing attribute "' +
                breadcrumbs + '" when trying to get attribute ' +
                breadcrumbs + '[' + split[i + 1] + ']');
        }
        value = value[split[i]];
    }
    return value
}

var Single = function <T extends Record<string,any>>(object:T, schema:Record<string,valueType>) {
    if (!(object instanceof Object)) throw new Error('Transformer received no valid object');
    if (object instanceof Array) throw new Error('Transformer received no valid object');
    this.object = object;
    if (!schema) throw new Error('Transformer received no valid schema');
    this.schema = schema;
};

Single.prototype.add = Add
Single.prototype.remove = Remove

Single.prototype.parse = function(){
    var response = {};
    for (var index in this.schema) {
        response[index] = casting(this.schema,index,this.object);
    }
    return response;
}


var list = function <T extends Record<string,any>>(array:T[], schema:Record<string,valueType>) {
    if (!(array instanceof Array)) throw new Error('Transformer received no valid array');
    this.array = array;
    if (!schema) throw new Error('Transformer received no valid schema');
    this.schema = schema;
};

list.prototype.parse = function (){  
    var response = [];
    for (var i in this.array) {
        response.push(new Single(this.array[i], this.schema).parse())
    }
    return response;
}

list.prototype.add = Add;
list.prototype.remove = Remove;


export default {Single,list}