export default function zero(obj: any, properties: (string|symbol|number)[]){
for(const prop of properties){
    obj[prop]=0
}
}