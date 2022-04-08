import * as cst from '@app/controllers/db.controller';
import { DataBaseController, DbDictionary, DICTIONARY_COLLECTION } from '@app/controllers/db.controller';
import * as fs from 'fs';
import { Collection } from 'mongodb';
import { Service } from 'typedi';

type WholeDictionary = { title: string; description: string; words: string[] };
export type ClientDictionaryInterface = { id: number; title: string; description: string };
export type DictPair = { oldDictionary: DbDictionary; newDictionary: DbDictionary };

@Service()
export class DbDictionariesService {
    private collection: Collection | undefined = undefined;
    constructor(private dataBase: DataBaseController) {
        this.collection = this.dataBase.db?.collection(DICTIONARY_COLLECTION);
    }

    async getDictionaries(): Promise<ClientDictionaryInterface[]> {
        if (!this.collection) return cst.DEFAULT_DICTIONARY;
        const dictionaries = (await this.collection
            .aggregate()
            .project({ _id: 0, id: 1, title: 1, description: 1 })
            .toArray()) as ClientDictionaryInterface[];
        console.log(dictionaries);
        return dictionaries;
    }

    async addDictionary(dictionary: DbDictionary): Promise<string> {
        let response = 'trying to upload new dictionary';
        const filteredDictionary: ClientDictionaryInterface = { id: dictionary.id, title: dictionary.title, description: dictionary.description };
        await this.collection?.insertOne(filteredDictionary);
        const fileToCreate: WholeDictionary = { title: dictionary.title, description: dictionary.description, words: dictionary.words };
        const jsonDictionary = JSON.stringify(fileToCreate);
        await fs.promises
            .writeFile(`./dictionaries/dictionary-${dictionary.id}.json`, jsonDictionary)
            .then(() => (response = 'succès'))
            .catch(() => (response = 'échec de téléversement du dictionnaire dans le serveur'));
        this.syncDictionaries();
        return response;
    }

    async updateDictionary(dictionary: DictPair) {
        await this.collection?.findOneAndReplace({ title: { $eq: dictionary.oldDictionary.title } }, dictionary.newDictionary);
        this.editFile(dictionary);
    }

    async editFile(files: DictPair) {
        const filename = files.oldDictionary.id;
        const newName = files.newDictionary.title;
        const data = await fs.promises.readFile(`./dictionaries/dictionary-${filename}.json`);

        const changeTitle = data.toString().replace(files.oldDictionary.title, newName);
        const changeDesc = changeTitle.replace(files.oldDictionary.description, files.newDictionary.description);
        await fs.promises.writeFile(`./dictionaries/dictionary-${filename}.json`, changeDesc);
    }

    async syncDictionaries() {
        const files = await fs.promises.readdir('./dictionaries/');
        for (const file of files) {
            const id = Number(file.split('-')[1][0]);
            await this.removeDictionaryFile(id);
        }
    }

    async downloadDictionary(id: string): Promise<string> {
        let result = '';
        await fs.promises
            .access(`./dictionaries/dictionary-${id}.json`, fs.constants.F_OK)
            .then(() => (result = `./dictionaries/dictionary-${id}.json`))
            .catch(() => (result = "Couldn't read this directory"));
        return result;
    }

    async removeDictionaryFile(fileId: number) {
        console.log(this.collection);
        const dictionaries = (await this.collection
            ?.aggregate()
            .project({ id: 1, title: 1, description: 1, _id: 0 })
            .toArray()) as ClientDictionaryInterface[];
        console.log(dictionaries);
        const idList = dictionaries.map((dictionary) => dictionary.id);

        if (!idList.includes(fileId)) {
            await fs.promises.unlink(`./dictionaries/dictionary-${fileId}.json`);
        }
    }

    async deleteDictionary(id: string) {
        if (!this.collection) return;
        await this.collection.deleteOne({ id: { $eq: Number(id) } });
        this.syncDictionaries();
    }

    async deleteAll() {
        if (!this.collection) return;
        await this.collection.deleteMany({ id: { $ne: 0 } });
        this.syncDictionaries();
    }
}
