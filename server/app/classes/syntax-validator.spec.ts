import { assert, expect } from 'chai';
import { SyntaxValidator } from './syntax-validator';

describe('syntax SyntaxValidator', () => {
    it('should separate the position of the word placement', (done) => {
        let positionArrayExpected = ['a', '7', 'h'];
        let position = 'a7h';

        let positionResult = SyntaxValidator.separatePosition(position);
        expect(positionResult[0]).to.be.equal(positionArrayExpected[0]);
        expect(positionResult[1]).to.be.equal(positionArrayExpected[1]);
        expect(positionResult[2]).to.be.equal(positionArrayExpected[2]);

        positionArrayExpected = ['o', '15', 'v'];
        position = 'o15v';
        positionResult = SyntaxValidator.separatePosition(position);
        expect(positionResult[0]).to.be.equal(positionArrayExpected[0]);
        expect(positionResult[1]).to.be.equal(positionArrayExpected[1]);
        expect(positionResult[2]).to.be.equal(positionArrayExpected[2]);

        positionArrayExpected = ['c', '11'];
        position = 'c11';
        positionResult = SyntaxValidator.separatePosition(position);
        expect(positionResult[0]).to.be.equal(positionArrayExpected[0]);
        expect(positionResult[1]).to.be.equal(positionArrayExpected[1]);
        expect(positionResult[2]).to.be.equal(undefined);

        positionArrayExpected = ['d', '7'];
        position = 'd7';
        positionResult = SyntaxValidator.separatePosition(position);
        expect(positionResult[0]).to.be.equal(positionArrayExpected[0]);
        expect(positionResult[1]).to.be.equal(positionArrayExpected[1]);
        expect(positionResult[2]).to.be.equal(undefined);
        done();
    });

    it('should validate valid positions', (done) => {
        let positionArray = ['g', '12', 'h'];
        let result = SyntaxValidator.validatePositionSyntax(positionArray, false);
        assert(result);

        positionArray = ['g', '12'];
        result = SyntaxValidator.validatePositionSyntax(positionArray, true);
        assert(result);

        positionArray = ['c', '9', 'v'];
        result = SyntaxValidator.validatePositionSyntax(positionArray, false);
        assert(result);
        done();
    });

    it('should not let positions out of bound or invalid orientation in the string', (done) => {
        let positionArray = ['v', '12', 'h'];
        let result = SyntaxValidator.validatePositionSyntax(positionArray, false);
        assert(!result);

        positionArray = ['c', '18', 'v'];
        result = SyntaxValidator.validatePositionSyntax(positionArray, false);
        assert(!result);

        positionArray = ['e', '17'];
        result = SyntaxValidator.validatePositionSyntax(positionArray, true);
        assert(!result);

        positionArray = ['e', '9', 'k'];
        result = SyntaxValidator.validatePositionSyntax(positionArray, false);
        assert(!result);
        done();
    });

    it('should not change a word that as no accents', (done) => {
        let word = 'test';
        expect(SyntaxValidator.removeAccents(word)).to.equal(word);

        word = 'tEst';
        expect(SyntaxValidator.removeAccents(word)).to.equal(word);
        done();
    });

    it('should change letters with accents', (done) => {
        let word = 'être';
        let expectedWord = 'etre';
        expect(SyntaxValidator.removeAccents(word)).to.equal(expectedWord);

        word = 'dîner';
        expectedWord = 'diner';
        expect(SyntaxValidator.removeAccents(word)).to.equal(expectedWord);
        done();
    });

    it('should keep uppercase and remove the accents', (done) => {
        let word = 'Être';
        let expectedWord = 'Etre';
        expect(SyntaxValidator.removeAccents(word)).to.equal(expectedWord);

        word = 'Âtre';
        expectedWord = 'Atre';
        expect(SyntaxValidator.removeAccents(word)).to.equal(expectedWord);
        done();
    });
});