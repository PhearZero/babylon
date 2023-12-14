export async function fetchAll(url, mutate = (r)=>r){
    const result = []
    async function letsGo(next = ''){
        const nextQuery = next !== '' ? `&next=${next}` : ''
        console.log(`Working on ${url}${nextQuery}`)
        const _next = await fetch(`${url}${nextQuery}`)
            .then(r=>r.json())
            .then(async (data)=>{
                result.push(data)
                return data['next-token']
            })
        if(typeof _next === 'string'){
            await letsGo(_next)
        }
    }

    await letsGo()
    return mutate(result);
}
