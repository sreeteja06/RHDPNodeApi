-- drop database rhdpTest;
-- GO

-- create database rhdpTest;
-- GO

use rhdpTest;
GO

create table users(
  userID int not null primary key identity(1,1),
  email varchar(60) not null UNIQUE,
  password varchar(300) not null,
  name varchar(50) not null,
  phone int not null,
);
GO

create table tokens(
  userID int not null,
  token varchar(300) not null,
  foreign key (userID) references users(userID),
  access varchar(100) not null,
);
GO

create procedure removeToken
  @inToken varchar(300)
  AS
  BEGIN
    delete from tokens where token = @inToken;
  END
GO

create procedure findByToken
@inToken varchar(300)
AS
  BEGIN
    select userID from tokens where token = @inToken;
  END
GO