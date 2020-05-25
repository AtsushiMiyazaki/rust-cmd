const CASTLE_TOKEN = 'es_cn_castle_05';
const EVERGOLD_TOKEN = 'es_evergold';
class CastleToken {
    init() {
        storage.put('castle_price', '1000');
        storage.put('cooldownTime', '0');
        storage.put('castle_count', '0');
    }
    can_update(data) {
        return blockchain.requireAuth(blockchain.contractOwner(), 'active');
    }
    setAdmin(account) {
        this._requireAuth(blockchain.contractOwner(), 'active');
        storage.put('adminAccount', account);
    }
    setGameContract(contract) {
        this._requireAuth(blockchain.contractOwner(), 'active');
        storage.put('gameContract', contract);
    }
    create() {
        this._requireAuth(blockchain.contractOwner(), 'active');
        blockchain.callWithAuth('token721.iost', 'create', [
            CASTLE_TOKEN,
            blockchain.contractName(),
            21000000
        ]);
    }
    issue(width, depth, oid) {
        const metaData = { name: 'Castle' };
        let buyer = this._getOAAAccount(oid);
        const price = storage.get('castle_price');
        const adminAccount = storage.get('adminAccount');
        blockchain.callWithAuth('token.iost', 'transfer', [
            EVERGOLD_TOKEN,
            blockchain.publisher(),
            adminAccount,
            price,
            oid + ' Bought a castle'
        ]);
        const res = blockchain.callWithAuth('token721.iost', 'issue', [
            CASTLE_TOKEN,
            blockchain.publisher(),
            JSON.stringify(metaData)
        ]);
        const tokenID = res[0];
        const info = {
            tokenID: tokenID,
            name: 'CASTLE#' + tokenID,
            width: width,
            depth: depth,
            price: Number(price),
            level: 1,
            exp: 0,
            readyTime: 0,
            tryCount: 0,
            winCount: 0,
            lossCount: 0,
            levelPoint: 0,
            reward: 0,
            traps: [],
            logs: [],
            isReady: true,
            owner: buyer
        };
        this._putInfo(tokenID, info);
        let count = this._get('castle_count');
        count = count + 1;
        this._put('castle_count', count);
        let castles = [];
        if (storage.mapHas('castles_by_owner', buyer)) {
            castles = this._mapGet('castles_by_owner', buyer);
        }
        castles.unshift(tokenID);
        this._mapPut('castles_by_owner', buyer, castles);
        return tokenID;
    }
    setName(castleid, name, oid) {
        this._checkAuth(castleid, oid);
        const info = this._getInfo(castleid);
        info.name = name;
        this._putInfo(castleid, info);
    }
    setPrice(price) {
        this._requireAuth(blockchain.contractOwner(), 'active');
        this._put('castle_price', price);
    }
    fix() {
        this._requireAuth(blockchain.contractOwner(), 'active');
        let count = this._get('castle_count');
        for (let i = 0; i < count; i = i + 1) {
            const info = this._getInfo(i);
            const res = blockchain.callWithAuth('token721.iost', 'ownerOf', [
                CASTLE_TOKEN,
                i.toString()
            ]);
            info.owner = res[0];
            this._putInfo(i, info);
        }
    }
    putInfo(castleid, infoStr) {
        const gameContract = storage.get('gameContract');
        this._requireAuth(gameContract, 'active');
        const key = 'castle_' + castleid;
        storage.put(key, infoStr);
    }
    _getOAAAccount(oid) {
        let account = blockchain.publisher();
        if (oid !== '') {
            account = blockchain.publisher() + ':' + oid;
        }
        return account;
    }
    _getInfo(castleid) {
        return this._get('castle_' + castleid);
    }
    _putInfo(castleid, info) {
        this._put('castle_' + castleid, info);
    }
    _get(k) {
        const val = storage.get(k);
        if (val === '') {
            return null;
        }
        return JSON.parse(val);
    }
    _put(k, v, p) {
        storage.put(k, JSON.stringify(v), p);
    }
    _mapGet(k, f) {
        const val = storage.mapGet(k, f);
        if (val === '') {
            return null;
        }
        return JSON.parse(val);
    }
    _mapPut(k, f, v, p) {
        storage.mapPut(k, f, JSON.stringify(v), p);
    }
    _checkAuth(castleid, oid) {
        const accout = this._getOAAAccount(oid);
        const info = this._getInfo(castleid);
        if (info.owner !== accout) {
            throw new Error('invalid owner ' + account);
        }
    }
    _requireAuth(account, permission) {
        const ret = blockchain.requireAuth(account, permission);
        if (ret !== true) {
            throw new Error('require auth failed. ret = ' + ret);
        }
    }
}
module.exports = CastleToken;