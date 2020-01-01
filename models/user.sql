-- drop database rhdpTest;
-- GO

-- create database rhdpTest;
-- GO

use rhdp;
GO

create table users(
  userID int not null primary key identity(1,1),
  email varchar(60) not null UNIQUE,
  password varchar(300) not null,
  name varchar(50) not null,
  phone bigint not null,
  isAdmin bit not null DEFAULT 0 
);
GO

CREATE TABLE tempUser(
  tempUserID int not null primary key identity(1,1),
  email varchar(60) not null UNIQUE,
  password varchar(300) not null,
  name varchar(50) not null,
  phone bigint not null,
  verified bit not null DEFAULT 0,
  OTP int not null
);
GO

CREATE PROCEDURE acceptUserRequest
  @inTempUserID int
AS
BEGIN
  SET NOCOUNT ON;
  INSERT into users (email, password, name, phone) SELECT email, password, name, phone FROM tempUser where tempUserID = @inTempUserID;
  DELETE FROM tempUser WHERE tempUserID = @inTempUserID;
END
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