package com.example.smartcampus.model;

public class Seat {
    private String id;
    private String number;
    private String type;
    private String status;
    private boolean hasPower;
    private boolean hasUsb;
    private boolean isAccessible;
    private int x;
    private int y;

    public Seat() {
    }

    public Seat(String id, String number, String type, String status, boolean hasPower, boolean hasUsb, boolean isAccessible, int x, int y) {
        this.id = id;
        this.number = number;
        this.type = type;
        this.status = status;
        this.hasPower = hasPower;
        this.hasUsb = hasUsb;
        this.isAccessible = isAccessible;
        this.x = x;
        this.y = y;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getNumber() {
        return number;
    }

    public void setNumber(String number) {
        this.number = number;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public boolean isHasPower() {
        return hasPower;
    }

    public void setHasPower(boolean hasPower) {
        this.hasPower = hasPower;
    }

    public boolean isHasUsb() {
        return hasUsb;
    }

    public void setHasUsb(boolean hasUsb) {
        this.hasUsb = hasUsb;
    }

    public boolean isAccessible() {
        return isAccessible;
    }

    public void setAccessible(boolean accessible) {
        isAccessible = accessible;
    }

    public int getX() {
        return x;
    }

    public void setX(int x) {
        this.x = x;
    }

    public int getY() {
        return y;
    }

    public void setY(int y) {
        this.y = y;
    }
}