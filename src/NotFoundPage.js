import React from 'react';
import { Link } from 'react-router-dom';
import './App.css';

function NotFoundPage() {
    return (
        <div className='App-header'>
            <h1>404: NOT_FOUND</h1>
            <Link to="/" >
                Top画面へ戻る
            </Link>
        </div>
    );
}

export default NotFoundPage;