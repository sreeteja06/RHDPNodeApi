-- create database rhdpTest;
-- go

use rhdp;
go

create table junctionPoint 
( 
  JID int primary key not null,
  longitude FLOAT not null,
  latitude FLOAT not null,
  area varchar(40) not null,
  city varchar(40) not null,
  junctionName varchar(40) not null
);
go

create UNIQUE INDEX unqJunLatLon 
    on junctionPoint(longitude, latitude);
go