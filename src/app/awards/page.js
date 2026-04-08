// Public Leaderboard Page for Gully Awards WhatsApp Voting System

import React from 'react';

const Leaderboard = () => {
    const votes = [
        { name: 'Nominee 1', votes: 120 },
        { name: 'Nominee 2', votes: 95 },
        { name: 'Nominee 3', votes: 75 },
    ];

    return (
        <div>
            <h1>Gully Awards Leaderboard</h1>
            <table>
                <thead>
                    <tr>
                        <th>Nominee</th>
                        <th>Votes</th>
                    </tr>
                </thead>
                <tbody>
                    {votes.map((nominee, index) => (
                        <tr key={index}>
                            <td>{nominee.name}</td>
                            <td>{nominee.votes}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Leaderboard;
