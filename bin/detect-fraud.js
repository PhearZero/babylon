// Address Age
// Address Payment Transaction Activity
//  - Address Transaction Volume
//  - Address Transaction Count
//  - Address Transaction Account Weighting (Weigh the associated wallets)
// Address Applications
// Address Application Activity


async function getAge(address) {
    let _account = null;
    if(typeof address === 'string'){
           _account = await fetch(`${ACCOUNT_URL}/${address}`).then(r=>r.json()).catch(()=>null)
    }
}
