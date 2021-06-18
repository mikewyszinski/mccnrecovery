## To run on replit

1. edit src/index.ts
2. enter seed and choose network and if you want to broadcast your txs

   ```typescript
   // example
   import { MultiChainNodeRecovery } from './MultiChainNodeRecovery'
   const nodeSeedPhrase = 'float next auto secret mixed nice comic december cycle curious essay priority'
   const network = 'testnet'
   const broadcastTxs = false

   const recovery = new MultiChainNodeRecovery(network, nodeSeedPhrase)

   recovery
     .run(broadcastTxs)
     .then(() => console.log('done'))
     .catch((error) => console.error(error))
   ```

3. click run

## Sample output

```
==========================================================
               MultiChainNodeRecovery: TESTNET
==========================================================
Looking for this Ygg Thor Address: tthor1gsmzmhnn59qcsfcmz44rhr6zgvzy69kzdxw4me
Nothing to send back to asgard for ZRX-0XE4C6182EA459E63B8F1BE7C428381994CCC2D49C, skipping...
============================================================
                    BNB
============================================================
  From YggAddress: tbnb1gsmzmhnn59qcsfcmz44rhr6zgvzy69kzr8skku
To Asgard Address: tbnb1g4mn46hq7nll6c7vmsfdaf08ml0ncnnrdz3q5y
             memo: YGGDRASIL-:49835
        Available: 32322877
   Amount To Send: 32322877
   Ready To Send?: ✅



============================================================
                    HEM-452
============================================================
  From YggAddress: tbnb1gsmzmhnn59qcsfcmz44rhr6zgvzy69kzr8skku
To Asgard Address: tbnb1g4mn46hq7nll6c7vmsfdaf08ml0ncnnrdz3q5y
             memo: YGGDRASIL-:49835
        Available: 210841
   Amount To Send: 210841
   Ready To Send?: ✅



============================================================
                    BUSD-74E
============================================================
  From YggAddress: tbnb1gsmzmhnn59qcsfcmz44rhr6zgvzy69kzr8skku
To Asgard Address: tbnb1g4mn46hq7nll6c7vmsfdaf08ml0ncnnrdz3q5y
             memo: YGGDRASIL-:49835
        Available: 186563861872
   Amount To Send: 186563861872
   Ready To Send?: ✅



============================================================
                    DAI-0XAD6D458402F60FD3BD25163575031ACDCE07538D
============================================================
  From YggAddress: 0xcf12e7d8b6f46e687de043cdad2aada104cae29a
To Asgard Address: 0xaa3cbb4ebc745c7fff7cfada52f39f404a214167
             memo: YGGDRASIL-:49835
        Available: 199919444430000000000
   Amount To Send: 199919444430000000000
   Ready To Send?: ✅



============================================================
                    ETH
============================================================
  From YggAddress: 0xcf12e7d8b6f46e687de043cdad2aada104cae29a
To Asgard Address: 0xaa3cbb4ebc745c7fff7cfada52f39f404a214167
             memo: YGGDRASIL-:49835
        Available: 2798623543419828376
   Amount To Send: 2801271980000000000
   Ready To Send?: ❌



============================================================
                    USDT-0XA3910454BF2CB59B8B3A401589A3BACC5CA42306
============================================================
  From YggAddress: 0xcf12e7d8b6f46e687de043cdad2aada104cae29a
To Asgard Address: 0xaa3cbb4ebc745c7fff7cfada52f39f404a214167
             memo: YGGDRASIL-:49835
        Available: 9149567
   Amount To Send: 9149567
   Ready To Send?: ✅



============================================================
                    LTC
============================================================
  From YggAddress: tltc1qgsmzmhnn59qcsfcmz44rhr6zgvzy69kz2zpcc5
To Asgard Address: tltc1qg4mn46hq7nll6c7vmsfdaf08ml0ncnnry8qw6v
             memo: YGGDRASIL-:49835
        Available: 348716307
   Amount To Send: 348716307
   Ready To Send?: ✅



============================================================
                    BCH
============================================================
  From YggAddress: qpzrvtw7wws5rzp8rv2k5wu0gfpsgngkcgra36neg0
To Asgard Address: qpzhwwh2ur60lltrenwp9h49ul0a70zwvvku2ma86j
             memo: YGGDRASIL-:49835
        Available: 9730201
   Amount To Send: 9730201
   Ready To Send?: ✅



============================================================
                    BTC
============================================================
  From YggAddress: tb1qgsmzmhnn59qcsfcmz44rhr6zgvzy69kzn2rxga
To Asgard Address: tb1qg4mn46hq7nll6c7vmsfdaf08ml0ncnnra0zs29
             memo: YGGDRASIL-:49835
        Available: 7110393
   Amount To Send: 7110393
   Ready To Send?: ✅



============================================================
                    XRUNE-0X8626DB1A4F9F3E1002EEB9A4F3C6D391436FFC23
============================================================
  From YggAddress: 0xcf12e7d8b6f46e687de043cdad2aada104cae29a
To Asgard Address: 0xaa3cbb4ebc745c7fff7cfada52f39f404a214167
             memo: YGGDRASIL-:49835
        Available: 2.277694903955e+22
   Amount To Send: 2.277694903955e+22
   Ready To Send?: ✅



============================================================
                    XRUNE-0X0FE3ECD525D16FA09AA1FF177014DE5304C835E2
============================================================
  From YggAddress: 0xcf12e7d8b6f46e687de043cdad2aada104cae29a
To Asgard Address: 0xaa3cbb4ebc745c7fff7cfada52f39f404a214167
             memo: YGGDRASIL-:49835
        Available: 2.05513492438436e+24
   Amount To Send: 2.05513492438436e+24
   Ready To Send?: ✅



============================================================
                    UNI-0X71D82EB6A5051CFF99582F4CDF2AE9CD402A4882
============================================================
  From YggAddress: 0xcf12e7d8b6f46e687de043cdad2aada104cae29a
To Asgard Address: 0xaa3cbb4ebc745c7fff7cfada52f39f404a214167
             memo: YGGDRASIL-:49835
        Available: 311023516960000000000
   Amount To Send: 311023516960000000000
   Ready To Send?: ✅



============================================================
                    XEENUS-0X7E0480CA9FD50EB7A3855CF53C347A1B4D6A2FF5
============================================================
  From YggAddress: 0xcf12e7d8b6f46e687de043cdad2aada104cae29a
To Asgard Address: 0xaa3cbb4ebc745c7fff7cfada52f39f404a214167
             memo: YGGDRASIL-:49835
        Available: 10946107480000000000
   Amount To Send: 10946107480000000000
   Ready To Send?: ✅



============================================================
                    REP-0X6FD34013CDD2905D8D27B0ADAD5B97B2345CF2B8
============================================================
  From YggAddress: 0xcf12e7d8b6f46e687de043cdad2aada104cae29a
To Asgard Address: 0xaa3cbb4ebc745c7fff7cfada52f39f404a214167
             memo: YGGDRASIL-:49835
        Available: 899985420000000000
   Amount To Send: 899985420000000000
   Ready To Send?: ✅



done
```
