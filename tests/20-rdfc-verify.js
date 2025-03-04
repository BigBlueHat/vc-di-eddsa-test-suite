/*!
 * Copyright (c) 2022-2023 Digital Bazaar, Inc. All rights reserved.
 */
import {bs58Decode, bs58Encode} from './helpers.js';
import {verificationFail, verificationSuccess} from './assertions.js';
import {
  checkDataIntegrityProofVerifyErrors
} from 'data-integrity-test-suite-assertion';
import {endpoints} from 'vc-test-suite-implementations';
import {generateTestData} from './vc-generator/index.js';

// only use implementations with `eddsa-rdfc-2022` verifiers.
const {match} = endpoints.filterByTag({
  tags: ['eddsa-rdfc-2022'],
  property: 'verifiers'
});

describe('eddsa-rdfc-2022 (verify)', function() {
  let credentials;
  before(async function() {
    credentials = await generateTestData();
  });
  checkDataIntegrityProofVerifyErrors({
    implemented: match,
  });
  describe('eddsa-rdfc-2022 (verifier)', function() {
    // this will tell the report
    // to make an interop matrix with this suite
    this.matrix = true;
    this.report = true;
    this.rowLabel = 'Test Name';
    this.columnLabel = 'Verifier';
    this.implemented = [...match.keys()];

    for(const [columnId, {endpoints}] of match) {
      describe(columnId, function() {
      // wrap the testApi config in an Implementation class
        const [verifier] = endpoints;
        it('MUST verify a valid VC with an eddsa-rdfc-2022 proof',
          async function() {
            this.test.cell = {columnId, rowId: this.test.title};
            const credential = credentials.clone('issuedVc');
            await verificationSuccess({credential, verifier});
          });
        it('If the "proofValue" field, when decoded to raw bytes, is not ' +
          '64 bytes in length if the associated public key is 32 bytes ' +
          'in length, or 114 bytes in length if the public key is 57 bytes ' +
          'in length, an error MUST be raised.',
        async function() {
          this.test.cell = {columnId, rowId: this.test.title};
          const credential = credentials.clone('issuedVc');
          const proofBytes = bs58Decode({id: credential.proof.proofValue});
          const randomBytes = new Uint8Array(32).map(
            () => Math.floor(Math.random() * 255));
          credential.proof.proofValue = bs58Encode(
            new Uint8Array([...proofBytes, ...randomBytes]));
          await verificationFail({credential, verifier});
        });
        it('If a canonicalization algorithm other than URDNA2015 is used, ' +
          'an error MUST be raised.', async function() {
          this.test.cell = {columnId, rowId: this.test.title};
          const credential = credentials.clone('canonizeJcs');
          await verificationFail({credential, verifier});
        });
        it('If a canonicalization data hashing other than algorithm ' +
          'SHA-2-256 is used, an error MUST be raised.',
        async function() {
          this.test.cell = {columnId, rowId: this.test.title};
          const credential = credentials.clone('digestSha512');
          await verificationFail({credential, verifier});
        });
        it('If the "cryptosuite" field is not the string "eddsa-rdfc-2022" ' +
          'or "eddsa-jcs-2022", an error MUST be raised.',
        async function() {
          this.test.cell = {columnId, rowId: this.test.title};
          const credential = credentials.clone('incorrectCryptosuite');
          await verificationFail({credential, verifier});
        });
      });
    }
  });
});
