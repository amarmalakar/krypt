import React, { useEffect, useState } from "react";
import { ethers } from "ethers";

import { contractABI, contractAddress } from "../utils/constants"

export const TransactionContext = React.createContext();

const { ethereum } = window;

const getEthereumContract = () => {
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const transactionContract = new ethers.Contract(contractAddress, contractABI, signer)

    // console.log({ provider , signer, transactionContract });
    return transactionContract;
}

export const TransactionProvider = ({ children }) => {
    const [connectedAccount, setConnectedAccount] = useState('');
    const [formData, setFormData] = useState({
        addressTo: '',
        amount: '',
        keyword: '',
        message: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [transactionCount, setTransactionCount] = useState(localStorage.getItem('transactionCount'));
    const [transactions, setTransactions] = useState([]);

    const handleChange = (e, name) => {
        setFormData((prevState) => ({ ...prevState, [name]: e.target.value }))
    }

    const getAllTransactions = async () => {
        try {
            if (ethereum) {
                const transactionsContract = createEthereumContract();

                const availableTransactions = await transactionsContract.getAllTransactions();

                const structuredTransactions = availableTransactions.map((transaction) => ({
                    addressTo: transaction.receiver,
                    addressFrom: transaction.sender,
                    timestamp: new Date(transaction.timestamp.toNumber() * 1000).toLocaleString(),
                    message: transaction.message,
                    keyword: transaction.keyword,
                    amount: parseInt(transaction.amount._hex) / (10 ** 18)
                }));

                // console.log(structuredTransactions);

                setTransactions(structuredTransactions);
            } else {
                console.log("Ethereum is not present");
            }
        } catch (error) {
            console.log(error);
        }
    }

    const checkIfWalletIsConnected = async () => {
        try {
            if (!ethereum) return alert("Please Install MetaMask");

            const accounts = await ethereum.request({ method: 'eth_accounts' });

            if (accounts.length) {
                setConnectedAccount(accounts[0]);

                // getAllTransactions()
            } else {
                console.log("No accounts found");;
            }
        } catch (err) {
            console.log(err);
            throw new Error("No Ethereum Object.");
        }
    }

    const connectWallet = async () => {
        try {
            if (!ethereum) return alert("Please Install MetaMask...");
            const accounts = await ethereum.request({ method: "eth_requestAccounts" })
            setConnectedAccount(accounts[0])
        } catch (err) {
            console.log(err);
            throw new Error("No Ethereum Object.");
        }
    }

    const sendTransaction = async () => {
        try {
            if (!ethereum) return alert("Please Install MetaMask...");

            const { addressTo, amount, keyword, message } = formData;
            const transactionContract = getEthereumContract();

            // convert in WEI
            const parsedAmount = ethers.utils.parseEther(amount);

            await ethereum.request({
                method: "eth_sendTransaction",
                params: [{
                    from: connectedAccount,
                    to: addressTo,
                    gas: "0x5208", //21000 GWEI
                    value: parsedAmount._hex
                }]
            })

            const transactionHash = await transactionContract.addToBlockchain(addressTo, parsedAmount, keyword, message);

            setIsLoading(true);
            console.log(`Loading - ${transactionHash.hash}`);
            await transactionHash.wait();
            setIsLoading(false);
            console.log(`Success - ${transactionHash.hash}`);

            const transactionCount = await transactionContract.getTransactionCount();

            setTransactionCount(transactionCount.toNumber())
        } catch (err) {
            console.log(err);
            throw new Error("No Ethereum Object.");
        }
    }

    useEffect(() => {
        checkIfWalletIsConnected()
    }, [])

    return <TransactionContext.Provider value={{ connectWallet, connectedAccount, formData, setFormData, handleChange, sendTransaction, transactions, isLoading }}>
        {children}
    </TransactionContext.Provider>
}